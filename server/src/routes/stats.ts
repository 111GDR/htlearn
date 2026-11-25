import { Router } from "express";
import { Course } from "../models/Course.js";
import { Enrollment } from "../models/Enrollment.js";
import { QuizAttempt } from "../models/QuizAttempt.js";
import { AuthRequest, requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

router.get("/student", requireAuth, async (req: AuthRequest, res) => {
  const enrollments = await Enrollment.find({ student: req.user!.id }).lean();
  const attempts = await QuizAttempt.find({ student: req.user!.id }).lean();
  const completed = enrollments.filter((e) => e.progress >= 100).length;
  const avgScore =
    attempts.length === 0 ? 0 : Math.round(attempts.reduce((s, a) => s + a.score, 0) / attempts.length);
  res.json({
    enrolled: enrollments.length,
    completed,
    inProgress: enrollments.length - completed,
    quizzesTaken: attempts.length,
    avgScore,
  });
});

router.get("/teacher", requireAuth, requireRole("teacher", "admin"), async (req: AuthRequest, res) => {
  const courses = await Course.find({ teacher: req.user!.id }).select("_id title").lean();
  const courseIds = courses.map((c) => c._id);
  const enrollments = await Enrollment.find({ course: { $in: courseIds } }).lean();
  const attempts = await QuizAttempt.find({ course: { $in: courseIds } }).lean();

  const perCourse = courses.map((c) => {
    const cEnrolls = enrollments.filter((e) => String(e.course) === String(c._id));
    const cAttempts = attempts.filter((a) => String(a.course) === String(c._id));
    const avg = cAttempts.length === 0 ? 0 : Math.round(cAttempts.reduce((s, a) => s + a.score, 0) / cAttempts.length);
    return {
      courseId: c._id,
      title: c.title,
      enrollments: cEnrolls.length,
      avgScore: avg,
      completionRate:
        cEnrolls.length === 0 ? 0 : Math.round((cEnrolls.filter((e) => e.progress >= 100).length / cEnrolls.length) * 100),
    };
  });

  res.json({
    totalCourses: courses.length,
    totalStudents: new Set(enrollments.map((e) => String(e.student))).size,
    totalAttempts: attempts.length,
    perCourse,
  });
});

export default router;
