import { Router } from "express";
import { z } from "zod";
import { Chapter } from "../models/Chapter.js";
import { Course } from "../models/Course.js";
import { Lesson } from "../models/Lesson.js";
import { Quiz } from "../models/Quiz.js";
import { AuthRequest, requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

const chapterSchema = z.object({
  course: z.string(),
  title: z.string().min(2).max(120),
  description: z.string().max(1000).optional(),
  order: z.number().int().min(0).default(0),
});

const ensureOwner = async (req: AuthRequest, courseId: string) => {
  const course = await Course.findById(courseId);
  if (!course) return { ok: false as const, status: 404, message: "Cours introuvable" };
  if (String(course.teacher) !== req.user!.id) {
    return { ok: false as const, status: 403, message: "Accès refusé" };
  }
  return { ok: true as const, course };
};

// Public: list chapters for a course (used by student CourseDetail and teacher edit)
router.get("/course/:courseId", async (req, res) => {
  const chapters = await Chapter.find({ course: req.params.courseId })
    .sort("order createdAt")
    .lean();
  res.json(chapters);
});

router.post("/", requireAuth, requireRole("teacher"), async (req: AuthRequest, res) => {
  const parsed = chapterSchema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ message: "Données invalides", errors: parsed.error.flatten() });
  const owner = await ensureOwner(req, parsed.data.course);
  if (!owner.ok) return res.status(owner.status).json({ message: owner.message });

  // Default order to "append to end" if not provided meaningfully
  let order = parsed.data.order;
  if (!order) {
    const last = await Chapter.findOne({ course: parsed.data.course }).sort("-order").lean();
    order = (last?.order ?? -1) + 1;
  }

  const chapter = await Chapter.create({ ...parsed.data, order });
  res.status(201).json(chapter);
});

router.put("/:id", requireAuth, requireRole("teacher"), async (req: AuthRequest, res) => {
  const chapter = await Chapter.findById(req.params.id);
  if (!chapter) return res.status(404).json({ message: "Chapitre introuvable" });
  const owner = await ensureOwner(req, String(chapter.course));
  if (!owner.ok) return res.status(owner.status).json({ message: owner.message });

  const parsed = chapterSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Données invalides" });
  Object.assign(chapter, parsed.data);
  await chapter.save();
  res.json(chapter);
});

// Bulk reorder — body: { ids: string[] } where index = new order
router.post("/reorder", requireAuth, requireRole("teacher"), async (req: AuthRequest, res) => {
  const { ids } = req.body as { ids?: string[] };
  if (!Array.isArray(ids) || !ids.length) return res.status(400).json({ message: "ids requis" });

  const first = await Chapter.findById(ids[0]);
  if (!first) return res.status(404).json({ message: "Chapitre introuvable" });
  const owner = await ensureOwner(req, String(first.course));
  if (!owner.ok) return res.status(owner.status).json({ message: owner.message });

  await Promise.all(
    ids.map((id, idx) =>
      Chapter.updateOne({ _id: id, course: first.course }, { $set: { order: idx } })
    )
  );
  res.json({ ok: true });
});

router.delete("/:id", requireAuth, requireRole("teacher"), async (req: AuthRequest, res) => {
  const chapter = await Chapter.findById(req.params.id);
  if (!chapter) return res.status(404).json({ message: "Chapitre introuvable" });
  const owner = await ensureOwner(req, String(chapter.course));
  if (!owner.ok) return res.status(owner.status).json({ message: owner.message });

  // Detach lessons and delete chapter exam(s)
  await Lesson.updateMany({ chapter: chapter._id }, { $unset: { chapter: 1 } });
  await Quiz.deleteMany({ chapter: chapter._id, kind: "chapter" });
  await chapter.deleteOne();
  res.json({ ok: true });
});

export default router;
