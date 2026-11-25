import { Router } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { User } from "../models/User.js";
import { AuthRequest, requireAuth } from "../middleware/auth.js";
import {
  validatePasswordStrength,
  generateResetToken,
  hashResetToken,
  RESET_TOKEN_TTL_MS,
} from "../lib/passwords.js";
import { sendResetEmail } from "../lib/mailer.js";

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const forgotSchema = z.object({
  email: z.string().email(),
});

const resetSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(1),
});

const changeSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(1),
});

const signToken = (id: string) =>
  jwt.sign({ id }, process.env.JWT_SECRET!, { expiresIn: "7d" });

const publicUser = (u: any) => ({
  id: u._id,
  name: u.name,
  email: u.email,
  role: u.role,
  studentId: u.studentId,
  grade: u.grade,
  mustChangePassword: !!u.mustChangePassword,
  avatar: u.avatar,
  bio: u.bio,
});

router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Données invalides" });

  const user = await User.findOne({ email: parsed.data.email });
  if (!user || !(await user.comparePassword(parsed.data.password))) {
    return res.status(401).json({ message: "Identifiants incorrects" });
  }
  if (user.disabled) {
    return res.status(403).json({
      message:
        "Ce compte a été désactivé. Contactez l'administration pour le réactiver.",
      code: "ACCOUNT_DISABLED",
    });
  }
  const token = signToken(String(user._id));
  res.json({ token, user: publicUser(user) });
});

router.get("/me", requireAuth, async (req: AuthRequest, res) => {
  const user = await User.findById(req.user!.id).lean();
  if (!user) return res.status(404).json({ message: "Utilisateur introuvable" });
  res.json({ user: publicUser(user) });
});

const updateMeSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  bio: z.string().trim().max(500).optional(),
  avatar: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .refine(
      (v) => !v || /^(https?:\/\/|\/uploads\/)/.test(v),
      "L'avatar doit être une URL valide."
    ),
});

router.patch("/me", requireAuth, async (req: AuthRequest, res) => {
  const parsed = updateMeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ message: "Données invalides", errors: parsed.error.flatten() });
  }
  const user = await User.findById(req.user!.id);
  if (!user) return res.status(404).json({ message: "Utilisateur introuvable" });
  if (parsed.data.name !== undefined) user.name = parsed.data.name;
  if (parsed.data.bio !== undefined) user.bio = parsed.data.bio;
  if (parsed.data.avatar !== undefined) user.avatar = parsed.data.avatar || undefined;
  await user.save();
  res.json({ user: publicUser(user) });
});

router.post("/forgot-password", async (req, res) => {
  const parsed = forgotSchema.safeParse(req.body);
  // Always respond 200 to avoid revealing which emails are registered.
  if (!parsed.success) return res.json({ ok: true });

  const user = await User.findOne({ email: parsed.data.email });
  if (user) {
    const { raw, hash } = generateResetToken();
    user.passwordResetTokenHash = hash;
    user.passwordResetExpires = new Date(Date.now() + RESET_TOKEN_TTL_MS);
    await user.save();
    try {
      await sendResetEmail({ name: user.name, email: user.email }, raw);
    } catch (e) {
      console.error("forgot-password: mail send failed", e);
    }
  }
  res.json({ ok: true });
});

router.post("/reset-password", async (req, res) => {
  const parsed = resetSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Données invalides" });

  const strengthError = validatePasswordStrength(parsed.data.password);
  if (strengthError) return res.status(400).json({ message: strengthError });

  const hash = hashResetToken(parsed.data.token);
  const user = await User.findOne({
    passwordResetTokenHash: hash,
    passwordResetExpires: { $gt: new Date() },
  });
  if (!user) {
    return res.status(400).json({ message: "Lien invalide ou expiré." });
  }

  user.password = parsed.data.password;
  user.passwordResetTokenHash = null;
  user.passwordResetExpires = null;
  user.mustChangePassword = false;
  await user.save();

  const token = signToken(String(user._id));
  res.json({ token, user: publicUser(user) });
});

router.post("/change-password", requireAuth, async (req: AuthRequest, res) => {
  const parsed = changeSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Données invalides" });

  const strengthError = validatePasswordStrength(parsed.data.newPassword);
  if (strengthError) return res.status(400).json({ message: strengthError });

  const user = await User.findById(req.user!.id);
  if (!user) return res.status(404).json({ message: "Utilisateur introuvable" });

  if (!(await user.comparePassword(parsed.data.currentPassword))) {
    return res.status(401).json({ message: "Mot de passe actuel incorrect." });
  }
  if (parsed.data.currentPassword === parsed.data.newPassword) {
    return res
      .status(400)
      .json({ message: "Le nouveau mot de passe doit être différent de l'ancien." });
  }

  user.password = parsed.data.newPassword;
  user.mustChangePassword = false;
  await user.save();

  res.json({ user: publicUser(user) });
});

export default router;
