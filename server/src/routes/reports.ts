import { Router } from "express";
import { z } from "zod";
import { Report } from "../models/Report.js";
import { AuthRequest, requireAuth } from "../middleware/auth.js";

const router = Router();

const reportSchema = z.object({
  targetType: z.enum(["user", "course", "lesson", "quiz", "other"]),
  targetId: z.string().optional(),
  reason: z.string().min(2).max(120),
  message: z.string().max(2000).optional(),
});

router.post("/", requireAuth, async (req: AuthRequest, res) => {
  const parsed = reportSchema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ message: "Données invalides", errors: parsed.error.flatten() });

  const report = await Report.create({
    reporter: req.user!.id,
    targetType: parsed.data.targetType,
    targetId: parsed.data.targetId || undefined,
    reason: parsed.data.reason,
    message: parsed.data.message,
  });
  res.status(201).json(report);
});

// Allow a user to see their own submitted reports
router.get("/mine", requireAuth, async (req: AuthRequest, res) => {
  const reports = await Report.find({ reporter: req.user!.id }).sort("-createdAt").lean();
  res.json(reports);
});

export default router;
