import { Router } from "express";
import { z } from "zod";
import { Types } from "mongoose";
import { Review } from "../models/Review.js";
import { Course } from "../models/Course.js";
import { Enrollment } from "../models/Enrollment.js";
import { AuthRequest, requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).optional(),
});

// Public: list reviews for a course + aggregate stats.
router.get("/course/:courseId", async (req, res) => {
  if (!Types.ObjectId.isValid(req.params.courseId)) {
    return res.status(400).json({ message: "ID de cours invalide" });
  }
  const courseId = new Types.ObjectId(req.params.courseId);
  const reviews = await Review.find({ course: courseId })
    .populate("student", "name avatar")
    .sort("-createdAt")
    .lean();

  const count = reviews.length;
  const avg = count === 0 ? 0 : reviews.reduce((s, r) => s + r.rating, 0) / count;

  const distribution = [1, 2, 3, 4, 5].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));

  res.json({
    count,
    average: Math.round(avg * 10) / 10,
    distribution,
    reviews,
  });
});

// Student: get my review for a course (or null).
router.get("/course/:courseId/me", requireAuth, async (req: AuthRequest, res) => {
  const review = await Review.findOne({
    course: req.params.courseId,
    student: req.user!.id,
  }).lean();
  res.json({ review });
});

// Student: create/update my review (upsert). Must be enrolled in the course.
router.put(
  "/course/:courseId",
  requireAuth,
  requireRole("student"),
  async (req: AuthRequest, res) => {
    const parsed = reviewSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ message: "Données invalides", errors: parsed.error.flatten() });
    }

    const course = await Course.findById(req.params.courseId).lean();
    if (!course) return res.status(404).json({ message: "Cours introuvable" });

    const enrolled = await Enrollment.findOne({
      course: course._id,
      student: req.user!.id,
    }).lean();
    if (!enrolled) {
      return res
        .status(403)
        .json({ message: "Vous devez être inscrit au cours pour le noter." });
    }

    const review = await Review.findOneAndUpdate(
      { course: course._id, student: req.user!.id },
      {
        course: course._id,
        student: req.user!.id,
        rating: parsed.data.rating,
        comment: parsed.data.comment || undefined,
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    res.status(200).json({ review });
  }
);

// Student: delete my own review.
router.delete("/course/:courseId", requireAuth, async (req: AuthRequest, res) => {
  const r = await Review.findOneAndDelete({
    course: req.params.courseId,
    student: req.user!.id,
  });
  if (!r) return res.status(404).json({ message: "Avis introuvable" });
  res.json({ ok: true });
});

export default router;
