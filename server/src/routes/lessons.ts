import { Router } from "express";
import { z } from "zod";
import { Lesson } from "../models/Lesson.js";
import { Course } from "../models/Course.js";
import { AuthRequest, requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

const lessonSchema = z.object({
  course: z.string(),
  chapter: z.string().nullable().optional(),
  title: z.string().min(2),
  kind: z.enum(["text", "pdf", "video", "audio"]).default("text"),
  content: z.string().default(""),
  mediaUrl: z.string().optional(),
  mediaSource: z.enum(["upload", "url"]).optional(),
  transcript: z.string().optional(),
  flashcards: z
    .array(
      z.object({
        front: z.string().min(1),
        back: z.string().min(1),
      })
    )
    .optional(),
  order: z.number().default(0),
  duration: z.number().optional(),
});

type OwnerCheck =
  | { ok: false; status: number; message: string }
  | { ok: true; course: NonNullable<Awaited<ReturnType<typeof Course.findById>>> };

const ensureOwner = async (req: AuthRequest, courseId: string): Promise<OwnerCheck> => {
  const course = await Course.findById(courseId);
  if (!course) return { ok: false, status: 404, message: "Cours introuvable" };
  if (String(course.teacher) !== req.user!.id) {
    return { ok: false, status: 403, message: "Accès refusé" };
  }
  return { ok: true, course };
};

router.get("/:id", async (req, res) => {
  const lesson = await Lesson.findById(req.params.id).lean();
  if (!lesson) return res.status(404).json({ message: "Leçon introuvable" });
  res.json(lesson);
});

router.post("/", requireAuth, requireRole("teacher"), async (req: AuthRequest, res) => {
  const parsed = lessonSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Données invalides", errors: parsed.error.flatten() });
  const owner = await ensureOwner(req, parsed.data.course);
  if (!owner.ok) return res.status(owner.status).json({ message: owner.message });
  const lesson = await Lesson.create(parsed.data);
  res.status(201).json(lesson);
});

router.put("/:id", requireAuth, requireRole("teacher"), async (req: AuthRequest, res) => {
  const lesson = await Lesson.findById(req.params.id);
  if (!lesson) return res.status(404).json({ message: "Leçon introuvable" });
  const owner = await ensureOwner(req, String(lesson.course));
  if (!owner.ok) return res.status(owner.status).json({ message: owner.message });
  const parsed = lessonSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Données invalides" });
  Object.assign(lesson, parsed.data);
  await lesson.save();
  res.json(lesson);
});

router.delete("/:id", requireAuth, requireRole("teacher"), async (req: AuthRequest, res) => {
  const lesson = await Lesson.findById(req.params.id);
  if (!lesson) return res.status(404).json({ message: "Leçon introuvable" });
  const owner = await ensureOwner(req, String(lesson.course));
  if (!owner.ok) return res.status(owner.status).json({ message: owner.message });
  await lesson.deleteOne();
  res.json({ ok: true });
});

export default router;
