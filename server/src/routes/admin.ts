import { Router } from "express";
import { z } from "zod";
import multer from "multer";
import { User } from "../models/User.js";
import { Report } from "../models/Report.js";
import { Course } from "../models/Course.js";
import { Enrollment } from "../models/Enrollment.js";
import { AuthRequest, requireAuth, requireRole } from "../middleware/auth.js";
import { generateTempPassword } from "../lib/passwords.js";
import { sendWelcomeEmail, sendPasswordResetByAdminEmail } from "../lib/mailer.js";
import { logAudit } from "../lib/audit.js";
import { AuditLog } from "../models/AuditLog.js";

const csvUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB CSV cap
});

// Minimal RFC-4180-ish CSV parser: handles quoted fields with embedded commas
// and "" escapes. Good enough for an admin-trusted file in this scope.
const parseCsv = (text: string): string[][] => {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else {
      if (c === '"') {
        inQuotes = true;
      } else if (c === ",") {
        row.push(field);
        field = "";
      } else if (c === "\r") {
        // ignore — CRLF handled by \n
      } else if (c === "\n") {
        row.push(field);
        rows.push(row);
        row = [];
        field = "";
      } else {
        field += c;
      }
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
};

const router = Router();

router.use(requireAuth, requireRole("admin"));

const publicUser = (u: any) => ({
  id: u._id,
  name: u.name,
  email: u.email,
  role: u.role,
  studentId: u.studentId,
  grade: u.grade,
  mustChangePassword: !!u.mustChangePassword,
  disabled: !!u.disabled,
  disabledAt: u.disabledAt,
  disabledReason: u.disabledReason,
  bio: u.bio,
  avatar: u.avatar,
  createdAt: u.createdAt,
});

// ---- Users ----

router.get("/users", async (req, res) => {
  const { role, search } = req.query as { role?: string; search?: string };
  const query: any = {};
  if (role && ["admin", "teacher", "student"].includes(role)) query.role = role;
  if (search) {
    const rx = new RegExp(search.trim(), "i");
    query.$or = [{ name: rx }, { email: rx }, { studentId: rx }];
  }
  const users = await User.find(query).sort("-createdAt").lean();
  res.json(users.map(publicUser));
});

const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  role: z.enum(["admin", "teacher", "student"]),
  studentId: z.string().trim().optional(),
  grade: z.string().trim().optional(),
  bio: z.string().optional(),
});

router.post("/users", async (req: AuthRequest, res) => {
  const parsed = createUserSchema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ message: "Données invalides", errors: parsed.error.flatten() });

  const { name, email, role, studentId, grade, bio } = parsed.data;

  const exists = await User.findOne({ email });
  if (exists) return res.status(409).json({ message: "Email déjà utilisé" });

  if (role === "student" && studentId) {
    const idExists = await User.findOne({ studentId, role: "student" });
    if (idExists) return res.status(409).json({ message: "Identifiant étudiant déjà utilisé" });
  }

  const tempPassword = generateTempPassword();
  const user = await User.create({
    name,
    email,
    role,
    studentId: role === "student" ? studentId : undefined,
    grade: role === "student" ? grade : undefined,
    bio,
    password: tempPassword,
    mustChangePassword: true,
  });

  try {
    await sendWelcomeEmail({ name: user.name, email: user.email }, tempPassword);
  } catch (e) {
    console.error("welcome email failed", e);
  }

  await logAudit(req, {
    action: "user.create",
    targetType: "user",
    targetId: String(user._id),
    targetLabel: user.email,
    meta: { role: user.role },
  });

  res.status(201).json(publicUser(user));
});

// CSV bulk import.
// Expected columns (header row required, case-insensitive): name, email, role, studentId, grade, bio
// Each successfully imported user gets a generated temp password emailed to them.
router.post(
  "/users/import",
  csvUpload.single("file"),
  async (_req: AuthRequest, res) => {
    const file = (_req as any).file as Express.Multer.File | undefined;
    if (!file) return res.status(400).json({ message: "Aucun fichier CSV reçu" });

    const text = file.buffer.toString("utf8").replace(/^﻿/, ""); // strip BOM
    const rows = parseCsv(text);
    if (rows.length < 2) {
      return res.status(400).json({ message: "CSV vide ou sans données" });
    }

    const header = rows[0].map((h) => h.trim().toLowerCase());
    const required = ["name", "email", "role"];
    const missing = required.filter((c) => !header.includes(c));
    if (missing.length > 0) {
      return res.status(400).json({
        message: `Colonnes manquantes : ${missing.join(", ")}. Format attendu : name, email, role[, studentId, grade, bio]`,
      });
    }
    const idx = (col: string) => header.indexOf(col);

    const created: { email: string; tempPassword: string }[] = [];
    const errors: { line: number; email?: string; reason: string }[] = [];
    let mailFailures = 0;

    for (let r = 1; r < rows.length; r++) {
      const cells = rows[r];
      const line = r + 1; // user-facing 1-based line including header
      const name = (cells[idx("name")] || "").trim();
      const email = (cells[idx("email")] || "").trim().toLowerCase();
      const role = (cells[idx("role")] || "").trim().toLowerCase();
      const studentId =
        idx("studentid") >= 0 ? (cells[idx("studentid")] || "").trim() : "";
      const grade = idx("grade") >= 0 ? (cells[idx("grade")] || "").trim() : "";
      const bio = idx("bio") >= 0 ? (cells[idx("bio")] || "").trim() : "";

      if (!name || name.length < 2) {
        errors.push({ line, email, reason: "Nom manquant ou trop court" });
        continue;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push({ line, email, reason: "Email invalide" });
        continue;
      }
      if (!["admin", "teacher", "student"].includes(role)) {
        errors.push({
          line,
          email,
          reason: `Rôle invalide ("${role}"). Attendu : admin, teacher ou student`,
        });
        continue;
      }

      const exists = await User.findOne({ email }).lean();
      if (exists) {
        errors.push({ line, email, reason: "Email déjà utilisé" });
        continue;
      }
      if (role === "student" && studentId) {
        const idExists = await User.findOne({ studentId, role: "student" }).lean();
        if (idExists) {
          errors.push({ line, email, reason: "Identifiant étudiant déjà utilisé" });
          continue;
        }
      }

      const tempPassword = generateTempPassword();
      try {
        const user = await User.create({
          name,
          email,
          role,
          studentId: role === "student" ? studentId || undefined : undefined,
          grade: role === "student" ? grade || undefined : undefined,
          bio: bio || undefined,
          password: tempPassword,
          mustChangePassword: true,
        });
        try {
          await sendWelcomeEmail({ name: user.name, email: user.email }, tempPassword);
        } catch (e) {
          mailFailures++;
          console.error("welcome email failed for", email, e);
        }
        created.push({ email: user.email, tempPassword });
      } catch (e: any) {
        errors.push({ line, email, reason: e?.message || "Création échouée" });
      }
    }

    await logAudit(_req, {
      action: "user.import",
      targetType: "other",
      meta: {
        createdCount: created.length,
        errorCount: errors.length,
        mailFailures,
      },
    });

    res.json({
      createdCount: created.length,
      errorCount: errors.length,
      mailFailures,
      errors: errors.slice(0, 50), // cap to keep response small
    });
  }
);

const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  role: z.enum(["admin", "teacher", "student"]).optional(),
  studentId: z.string().trim().optional(),
  grade: z.string().trim().optional(),
  bio: z.string().optional(),
});

router.patch("/users/:id", async (req: AuthRequest, res) => {
  const parsed = updateUserSchema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ message: "Données invalides", errors: parsed.error.flatten() });

  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: "Utilisateur introuvable" });

  if (parsed.data.email && parsed.data.email !== user.email) {
    const exists = await User.findOne({ email: parsed.data.email });
    if (exists) return res.status(409).json({ message: "Email déjà utilisé" });
  }

  const changedKeys = Object.keys(parsed.data);
  Object.assign(user, parsed.data);
  await user.save();
  await logAudit(req, {
    action: "user.update",
    targetType: "user",
    targetId: String(user._id),
    targetLabel: user.email,
    meta: { fields: changedKeys },
  });
  res.json(publicUser(user));
});

router.post("/users/:id/reset-password", async (req: AuthRequest, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: "Utilisateur introuvable" });

  const tempPassword = generateTempPassword();
  user.password = tempPassword;
  user.mustChangePassword = true;
  user.passwordResetTokenHash = null;
  user.passwordResetExpires = null;
  await user.save();

  try {
    await sendPasswordResetByAdminEmail(
      { name: user.name, email: user.email },
      tempPassword
    );
  } catch (e) {
    console.error("admin reset email failed", e);
  }

  await logAudit(req, {
    action: "user.reset-password",
    targetType: "user",
    targetId: String(user._id),
    targetLabel: user.email,
  });

  res.json({ ok: true });
});

const disableSchema = z.object({
  disabled: z.boolean(),
  reason: z.string().trim().max(280).optional(),
});

router.post("/users/:id/disable", async (req: AuthRequest, res) => {
  const parsed = disableSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Données invalides" });

  if (req.params.id === req.user!.id) {
    return res
      .status(400)
      .json({ message: "Vous ne pouvez pas désactiver votre propre compte." });
  }
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: "Utilisateur introuvable" });

  user.disabled = parsed.data.disabled;
  user.disabledAt = parsed.data.disabled ? new Date() : null;
  user.disabledReason = parsed.data.disabled ? parsed.data.reason : undefined;
  await user.save();

  await logAudit(req, {
    action: parsed.data.disabled ? "user.disable" : "user.enable",
    targetType: "user",
    targetId: String(user._id),
    targetLabel: user.email,
    meta: parsed.data.disabled && parsed.data.reason ? { reason: parsed.data.reason } : undefined,
  });

  res.json(publicUser(user));
});

router.delete("/users/:id", async (req: AuthRequest, res) => {
  if (req.params.id === req.user!.id) {
    return res.status(400).json({ message: "Vous ne pouvez pas supprimer votre propre compte" });
  }
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: "Utilisateur introuvable" });
  const snapshot = { email: user.email, role: user.role };
  await user.deleteOne();
  await logAudit(req, {
    action: "user.delete",
    targetType: "user",
    targetId: String(user._id),
    targetLabel: snapshot.email,
    meta: snapshot,
  });
  res.json({ ok: true });
});

// ---- Reports (admin side) ----

router.get("/reports", async (req, res) => {
  const { status, targetType } = req.query as { status?: string; targetType?: string };
  const query: any = {};
  if (status && ["open", "resolved", "dismissed"].includes(status)) query.status = status;
  if (targetType && ["user", "course", "lesson", "quiz", "other"].includes(targetType))
    query.targetType = targetType;

  const reports = await Report.find(query)
    .sort("-createdAt")
    .populate("reporter", "name email role")
    .populate("resolvedBy", "name")
    .lean();
  res.json(reports);
});

const updateReportSchema = z.object({
  status: z.enum(["open", "resolved", "dismissed"]),
  resolution: z.string().optional(),
});

router.patch("/reports/:id", async (req: AuthRequest, res) => {
  const parsed = updateReportSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Données invalides" });

  const report = await Report.findById(req.params.id);
  if (!report) return res.status(404).json({ message: "Signalement introuvable" });

  const wasOpen = report.status === "open";
  report.status = parsed.data.status;
  report.resolution = parsed.data.resolution;
  if (parsed.data.status !== "open") {
    report.resolvedBy = req.user!.id as any;
    report.resolvedAt = new Date();
  } else {
    report.resolvedBy = undefined;
    report.resolvedAt = undefined;
  }
  await report.save();

  await logAudit(req, {
    action: "report.update",
    targetType: "report",
    targetId: String(report._id),
    targetLabel: report.reason?.slice(0, 80),
    meta: { status: parsed.data.status },
  });

  // Notify the reporter when transitioning from open → resolved/dismissed
  if (wasOpen && parsed.data.status !== "open") {
    const { Notification } = await import("../models/Notification.js");
    await Notification.create({
      user: report.reporter,
      kind: parsed.data.status === "resolved" ? "report-resolved" : "report-dismissed",
      title:
        parsed.data.status === "resolved"
          ? "Votre signalement a été résolu"
          : "Votre signalement a été rejeté",
      body: parsed.data.resolution || report.reason,
      link: "/report-bug",
    });
  }

  res.json(report);
});

router.delete("/reports/:id", async (req: AuthRequest, res) => {
  const report = await Report.findById(req.params.id);
  if (!report) return res.status(404).json({ message: "Signalement introuvable" });
  await report.deleteOne();
  await logAudit(req, {
    action: "report.delete",
    targetType: "report",
    targetId: String(report._id),
    targetLabel: report.reason?.slice(0, 80),
  });
  res.json({ ok: true });
});

// ---- Audit log ----

router.get("/audit", async (req, res) => {
  const { action, actor, targetType, limit } = req.query as Record<string, string>;
  const query: any = {};
  if (action) query.action = action;
  if (actor) query.actor = actor;
  if (targetType && ["user", "report", "course", "other"].includes(targetType)) {
    query.targetType = targetType;
  }
  const n = Math.max(1, Math.min(500, Number(limit) || 200));
  const logs = await AuditLog.find(query)
    .sort("-createdAt")
    .limit(n)
    .populate("actor", "name email avatar role")
    .lean();
  res.json(logs);
});

// ---- Stats ----

router.get("/stats", async (_req, res) => {
  const [totalUsers, totalTeachers, totalStudents, totalAdmins, totalCourses, totalEnrollments, openReports] =
    await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "teacher" }),
      User.countDocuments({ role: "student" }),
      User.countDocuments({ role: "admin" }),
      Course.countDocuments(),
      Enrollment.countDocuments(),
      Report.countDocuments({ status: "open" }),
    ]);
  res.json({
    totalUsers,
    totalTeachers,
    totalStudents,
    totalAdmins,
    totalCourses,
    totalEnrollments,
    openReports,
  });
});

export default router;
