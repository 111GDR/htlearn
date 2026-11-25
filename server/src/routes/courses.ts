import { Router } from "express";
import { z } from "zod";
import { Course } from "../models/Course.js";
import { Lesson } from "../models/Lesson.js";
import { Quiz } from "../models/Quiz.js";
import { Enrollment } from "../models/Enrollment.js";
import { Review } from "../models/Review.js";
import { AuthRequest, requireAuth, requireRole } from "../middleware/auth.js";

// Compute rating aggregates ({ avg, count } per course id) so course-listing
// responses can show stars without N+1 queries.
const ratingMapForCourses = async (courseIds: any[]) => {
  if (courseIds.length === 0) return new Map<string, { average: number; count: number }>();
  const agg = await Review.aggregate([
    { $match: { course: { $in: courseIds } } },
    {
      $group: {
        _id: "$course",
        average: { $avg: "$rating" },
        count: { $sum: 1 },
      },
    },
  ]);
  const map = new Map<string, { average: number; count: number }>();
  for (const a of agg) {
    map.set(String(a._id), {
      average: Math.round(a.average * 10) / 10,
      count: a.count,
    });
  }
  return map;
};

const router = Router();

const courseSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  category: z.string().min(2),
  level: z.enum(["Débutant", "Intermédiaire", "Avancé"]).default("Débutant"),
  thumbnail: z.string().optional(),
  published: z.boolean().optional(),
});

// Teacher: list students enrolled in one of my courses, with progress + scores.
router.get(
  "/:id/students",
  requireAuth,
  requireRole("teacher", "admin"),
  async (req: AuthRequest, res) => {
    const course = await Course.findById(req.params.id).lean();
    if (!course) return res.status(404).json({ message: "Cours introuvable" });
    if (req.user!.role === "teacher" && String(course.teacher) !== req.user!.id) {
      return res.status(403).json({ message: "Accès refusé" });
    }

    const lessons = await Lesson.find({ course: course._id }).select("_id title").lean();
    const totalLessons = lessons.length;

    const enrollments = await Enrollment.find({ course: course._id })
      .populate("student", "name email avatar studentId grade")
      .sort("-createdAt")
      .lean();

    const quizzes = await Quiz.find({ course: course._id }).select("_id title kind").lean();
    const finalExam = quizzes.find((q) => q.kind === "final");

    const { QuizAttempt } = await import("../models/QuizAttempt.js");
    const attempts = await QuizAttempt.find({
      course: course._id,
      student: { $in: enrollments.map((e) => e.student?._id).filter(Boolean) },
    })
      .select("student quiz score status passed createdAt")
      .lean();

    const rows = enrollments
      .filter((e) => e.student) // skip orphaned enrollments
      .map((e) => {
        const studentAttempts = attempts.filter(
          (a) => String(a.student) === String((e.student as any)._id)
        );
        const gradedAttempts = studentAttempts.filter((a) => a.status === "graded");
        const avgScore =
          gradedAttempts.length === 0
            ? null
            : Math.round(
                gradedAttempts.reduce((s, a) => s + a.score, 0) / gradedAttempts.length
              );
        const finalAttempts = finalExam
          ? studentAttempts.filter((a) => String(a.quiz) === String(finalExam._id))
          : [];
        const bestFinal =
          finalAttempts.length === 0
            ? null
            : Math.max(...finalAttempts.map((a) => a.score));
        const finalStatus = !finalExam
          ? "no-final"
          : finalAttempts.length === 0
          ? "not-attempted"
          : finalAttempts.some((a) => a.status === "pending")
          ? "pending"
          : finalAttempts.some((a) => a.passed)
          ? "passed"
          : "failed";

        return {
          enrollmentId: e._id,
          student: e.student,
          enrolledAt: e.createdAt,
          progress: e.progress,
          completedLessons: e.completedLessons?.length || 0,
          totalLessons,
          attemptsCount: studentAttempts.length,
          avgScore,
          finalStatus,
          bestFinal,
          lastActivity: studentAttempts.length
            ? studentAttempts
                .map((a) => +new Date(a.createdAt as any))
                .reduce((m, t) => Math.max(m, t), 0)
            : +new Date(e.createdAt as any),
        };
      });

    res.json({
      course: { _id: course._id, title: course.title },
      totalLessons,
      hasFinal: !!finalExam,
      students: rows,
    });
  }
);

// Public: list published courses
router.get("/", async (req, res) => {
  const { search, category } = req.query as { search?: string; category?: string };
  const query: any = { published: true };
  if (search) query.title = { $regex: search, $options: "i" };
  if (category && category !== "all") query.category = category;

  const courses = await Course.find(query).populate("teacher", "name avatar").sort("-createdAt").lean();
  const ratings = await ratingMapForCourses(courses.map((c) => c._id));
  const enriched = courses.map((c) => ({
    ...c,
    rating: ratings.get(String(c._id)) || { average: 0, count: 0 },
  }));
  res.json(enriched);
});

// Teacher: list own courses (incl. drafts)
router.get("/mine", requireAuth, requireRole("teacher"), async (req: AuthRequest, res) => {
  const courses = await Course.find({ teacher: req.user!.id }).sort("-createdAt").lean();
  res.json(courses);
});

// Course detail with lessons + quiz info
router.get("/:id", async (req, res) => {
  const course = await Course.findById(req.params.id).populate("teacher", "name avatar bio").lean();
  if (!course) return res.status(404).json({ message: "Cours introuvable" });

  const lessons = await Lesson.find({ course: course._id }).sort("order").lean();
  const quizzes = await Quiz.find({ course: course._id })
    .select("_id title kind lesson chapter questions passingScore timeLimitSec")
    .lean();

  // strip correct answers from public quiz data
  const publicQuizzes = quizzes.map((q) => ({
    _id: q._id,
    title: q.title,
    kind: q.kind || "practice",
    lesson: q.lesson,
    chapter: q.chapter,
    passingScore: q.passingScore,
    timeLimitSec: q.timeLimitSec,
    questionCount: q.questions.length,
  }));

  res.json({ course, lessons, quizzes: publicQuizzes });
});

// Create course
router.post("/", requireAuth, requireRole("teacher"), async (req: AuthRequest, res) => {
  const parsed = courseSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Données invalides", errors: parsed.error.flatten() });
  const course = await Course.create({ ...parsed.data, teacher: req.user!.id });
  res.status(201).json(course);
});

// Update course
router.put("/:id", requireAuth, requireRole("teacher"), async (req: AuthRequest, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) return res.status(404).json({ message: "Cours introuvable" });
  if (String(course.teacher) !== req.user!.id) {
    return res.status(403).json({ message: "Accès refusé" });
  }
  const parsed = courseSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Données invalides" });
  Object.assign(course, parsed.data);
  await course.save();
  res.json(course);
});

// Delete course (cascades)
router.delete("/:id", requireAuth, requireRole("teacher"), async (req: AuthRequest, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) return res.status(404).json({ message: "Cours introuvable" });
  if (String(course.teacher) !== req.user!.id) {
    return res.status(403).json({ message: "Accès refusé" });
  }
  await Promise.all([
    Lesson.deleteMany({ course: course._id }),
    Quiz.deleteMany({ course: course._id }),
    Enrollment.deleteMany({ course: course._id }),
    course.deleteOne(),
  ]);
  res.json({ ok: true });
});

export default router;
