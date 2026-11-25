import { Router } from "express";
import { Enrollment } from "../models/Enrollment.js";
import { Lesson } from "../models/Lesson.js";
import { AuthRequest, requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAuth, async (req: AuthRequest, res) => {
  const enrollments = await Enrollment.find({ student: req.user!.id })
    .populate({
      path: "course",
      populate: { path: "teacher", select: "name avatar" },
    })
    .sort("-createdAt")
    .lean();
  res.json(enrollments);
});

router.get("/course/:courseId", requireAuth, async (req: AuthRequest, res) => {
  const enrollment = await Enrollment.findOne({
    student: req.user!.id,
    course: req.params.courseId,
  }).lean();
  res.json(enrollment);
});

router.post("/:courseId", requireAuth, async (req: AuthRequest, res) => {
  const existing = await Enrollment.findOne({
    student: req.user!.id,
    course: req.params.courseId,
  });
  if (existing) return res.json(existing);

  const enrollment = await Enrollment.create({
    student: req.user!.id,
    course: req.params.courseId,
  });
  res.status(201).json(enrollment);
});

router.post("/:courseId/complete-lesson/:lessonId", requireAuth, async (req: AuthRequest, res) => {
  const enrollment = await Enrollment.findOne({
    student: req.user!.id,
    course: req.params.courseId,
  });
  if (!enrollment) return res.status(404).json({ message: "Inscription introuvable" });

  const lessonId = req.params.lessonId;
  const already = enrollment.completedLessons.some((id) => String(id) === lessonId);
  if (!already) {
    enrollment.completedLessons.push(lessonId as any);
  }

  const total = await Lesson.countDocuments({ course: req.params.courseId });
  enrollment.progress = total === 0 ? 0 : Math.round((enrollment.completedLessons.length / total) * 100);
  if (enrollment.progress >= 100 && !enrollment.completedAt) {
    enrollment.completedAt = new Date();
  }
  await enrollment.save();
  res.json(enrollment);
});

export default router;
