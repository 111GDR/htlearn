import { Router } from "express";
import { z } from "zod";
import { Quiz } from "../models/Quiz.js";
import { Lesson } from "../models/Lesson.js";
import { Course } from "../models/Course.js";
import { QuizAttempt } from "../models/QuizAttempt.js";
import { Enrollment } from "../models/Enrollment.js";
import { AuthRequest, requireAuth, requireRole } from "../middleware/auth.js";
import { generateQuizQuestions } from "../lib/groq.js";

const router = Router();

const mediaSchema = z.object({
  kind: z.enum(["text", "pdf", "video", "audio"]),
  url: z.string().min(1),
  source: z.enum(["upload", "url"]).optional(),
});

const mcqQuestion = z.object({
  type: z.literal("mcq"),
  text: z.string().min(1),
  options: z.array(z.string().min(1)).min(2),
  correctIndex: z.number().int().min(0),
  explanation: z.string().optional(),
  media: mediaSchema.optional(),
});

const tfQuestion = z.object({
  type: z.literal("tf"),
  text: z.string().min(1),
  correctBool: z.boolean(),
  explanation: z.string().optional(),
  media: mediaSchema.optional(),
});

const fillQuestion = z.object({
  type: z.literal("fill"),
  text: z.string().min(1).refine((s) => s.includes("___"), {
    message: "Le texte d'une question à trous doit contenir au moins un \"___\"",
  }),
  blanks: z.array(z.string().min(1)).min(1),
  explanation: z.string().optional(),
  media: mediaSchema.optional(),
});

const orderQuestion = z.object({
  type: z.literal("order"),
  text: z.string().min(1),
  items: z.array(z.string().min(1)).min(2),
  explanation: z.string().optional(),
  media: mediaSchema.optional(),
});

const textQuestion = z.object({
  type: z.literal("text"),
  text: z.string().min(1),
  expectedAnswer: z.string().optional(),
  explanation: z.string().optional(),
  media: mediaSchema.optional(),
});

const questionSchema = z.discriminatedUnion("type", [
  mcqQuestion,
  tfQuestion,
  fillQuestion,
  orderQuestion,
  textQuestion,
]);

const quizSchema = z.object({
  // For practice quizzes (default) lesson is required.
  // For chapter exams, `chapter` is required and `lesson` is omitted.
  // For final exams, neither lesson nor chapter is set (one final per course).
  kind: z.enum(["practice", "chapter", "final"]).default("practice"),
  lesson: z.string().optional(),
  chapter: z.string().optional(),
  course: z.string().optional(), // explicit course required for "final"
  title: z.string().min(2),
  questions: z.array(questionSchema).min(1),
  passingScore: z.number().min(0).max(100).default(60),
  timeLimitSec: z.number().int().min(60).max(60 * 60 * 6).optional(),
});

const shuffle = <T>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const normalize = (s: string) => s.trim().toLowerCase();

// Get quiz for student (without correct answers)
router.get("/:id", requireAuth, async (req, res) => {
  const quiz = await Quiz.findById(req.params.id).lean();
  if (!quiz) return res.status(404).json({ message: "Quiz introuvable" });
  const publicQuestions = quiz.questions.map((q) => {
    const base: any = { type: q.type || "mcq", text: q.text, media: q.media };
    if ((q.type || "mcq") === "mcq") {
      return { ...base, options: q.options };
    }
    if (q.type === "tf") {
      return base;
    }
    if (q.type === "fill") {
      return { ...base, blankCount: (q.blanks || []).length };
    }
    if (q.type === "order") {
      return { ...base, items: shuffle(q.items || []) };
    }
    return base;
  });
  res.json({
    _id: quiz._id,
    kind: quiz.kind || "practice",
    title: quiz.title,
    lesson: quiz.lesson,
    chapter: quiz.chapter,
    course: quiz.course,
    passingScore: quiz.passingScore,
    timeLimitSec: quiz.timeLimitSec,
    questions: publicQuestions,
  });
});

// Teacher view (with answers)
router.get("/:id/full", requireAuth, requireRole("teacher"), async (req: AuthRequest, res) => {
  const quiz = await Quiz.findById(req.params.id).lean();
  if (!quiz) return res.status(404).json({ message: "Quiz introuvable" });
  const course = await Course.findById(quiz.course);
  if (!course) return res.status(404).json({ message: "Cours introuvable" });
  if (String(course.teacher) !== req.user!.id) {
    return res.status(403).json({ message: "Accès refusé" });
  }
  res.json(quiz);
});

const formatZodError = (err: import("zod").ZodError) => {
  const first = err.issues[0];
  if (!first) return "Données invalides";
  const path = first.path.length ? first.path.join(".") : "";
  return path
    ? `Données invalides — ${path} : ${first.message}`
    : `Données invalides — ${first.message}`;
};

router.post("/", requireAuth, requireRole("teacher"), async (req: AuthRequest, res) => {
  const parsed = quizSchema.safeParse(req.body);
  if (!parsed.success)
    return res
      .status(400)
      .json({ message: formatZodError(parsed.error), errors: parsed.error.flatten() });

  let courseId: any = null;

  // No `text` questions allowed in practice or chapter quizzes — only final.
  if (parsed.data.kind !== "final") {
    const hasText = parsed.data.questions.some((q) => q.type === "text");
    if (hasText) {
      return res.status(400).json({
        message:
          "Les questions à réponse libre sont réservées à l'examen final.",
      });
    }
  }

  if (parsed.data.kind === "final") {
    if (!parsed.data.course) {
      return res.status(400).json({ message: "courseId requis pour l'examen final." });
    }
    if (!parsed.data.timeLimitSec) {
      return res.status(400).json({ message: "Une durée (timeLimitSec) est requise pour l'examen final." });
    }
    const course = await Course.findById(parsed.data.course);
    if (!course) return res.status(404).json({ message: "Cours introuvable" });
    if (String(course.teacher) !== req.user!.id) {
      return res.status(403).json({ message: "Accès refusé" });
    }
    const existing = await Quiz.findOne({ course: course._id, kind: "final" });
    if (existing) {
      return res
        .status(409)
        .json({ message: "Ce cours a déjà un examen final.", quizId: existing._id });
    }
    courseId = course._id;
  } else if (parsed.data.kind === "chapter") {
    if (!parsed.data.chapter) {
      return res.status(400).json({ message: "Un chapitre est requis pour un examen de chapitre." });
    }
    // Prevent more than one chapter exam per chapter
    const existing = await Quiz.findOne({ chapter: parsed.data.chapter, kind: "chapter" });
    if (existing) {
      return res
        .status(409)
        .json({ message: "Ce chapitre a déjà un examen.", quizId: existing._id });
    }
    const Chapter = (await import("../models/Chapter.js")).Chapter;
    const chapter = await Chapter.findById(parsed.data.chapter);
    if (!chapter) return res.status(404).json({ message: "Chapitre introuvable" });
    const course = await Course.findById(chapter.course);
    if (!course) return res.status(404).json({ message: "Cours introuvable" });
    if (String(course.teacher) !== req.user!.id) {
      return res.status(403).json({ message: "Accès refusé" });
    }
    courseId = course._id;
  } else {
    // practice
    if (!parsed.data.lesson) {
      return res.status(400).json({ message: "Une leçon est requise pour un quiz d'entraînement." });
    }
    const lesson = await Lesson.findById(parsed.data.lesson);
    if (!lesson) return res.status(404).json({ message: "Leçon introuvable" });
    const course = await Course.findById(lesson.course);
    if (!course) return res.status(404).json({ message: "Cours introuvable" });
    if (String(course.teacher) !== req.user!.id) {
      return res.status(403).json({ message: "Accès refusé" });
    }
    courseId = course._id;
  }

  const quiz = await Quiz.create({ ...parsed.data, course: courseId });
  res.status(201).json(quiz);
});

router.put("/:id", requireAuth, requireRole("teacher"), async (req: AuthRequest, res) => {
  const quiz = await Quiz.findById(req.params.id);
  if (!quiz) return res.status(404).json({ message: "Quiz introuvable" });
  const course = await Course.findById(quiz.course);
  if (!course) return res.status(404).json({ message: "Cours introuvable" });
  if (String(course.teacher) !== req.user!.id) {
    return res.status(403).json({ message: "Accès refusé" });
  }
  const parsed = quizSchema.partial().safeParse(req.body);
  if (!parsed.success)
    return res
      .status(400)
      .json({ message: formatZodError(parsed.error), errors: parsed.error.flatten() });
  Object.assign(quiz, parsed.data);
  await quiz.save();
  res.json(quiz);
});

router.delete("/:id", requireAuth, requireRole("teacher"), async (req: AuthRequest, res) => {
  const quiz = await Quiz.findById(req.params.id);
  if (!quiz) return res.status(404).json({ message: "Quiz introuvable" });
  const course = await Course.findById(quiz.course);
  if (!course) return res.status(404).json({ message: "Cours introuvable" });
  if (String(course.teacher) !== req.user!.id) {
    return res.status(403).json({ message: "Accès refusé" });
  }
  await quiz.deleteOne();
  res.json({ ok: true });
});

// AI: generate questions for a lesson (teacher-only, course-owner)
router.post("/generate", requireAuth, requireRole("teacher"), async (req: AuthRequest, res) => {
  const { lessonId, count, types } = req.body as {
    lessonId?: string;
    count?: number;
    types?: string[];
  };
  if (!lessonId) return res.status(400).json({ message: "lessonId requis" });

  const n = Math.max(1, Math.min(15, Number(count) || 5));

  const allowedTypes = ["mcq", "fill", "order"] as const;
  const requested = Array.isArray(types) && types.length > 0 ? types : ["mcq"];
  const cleanTypes = requested.filter((t): t is "mcq" | "fill" | "order" =>
    (allowedTypes as readonly string[]).includes(t)
  );
  if (!cleanTypes.length) {
    return res.status(400).json({ message: "Au moins un type de question doit être sélectionné" });
  }

  const lesson = await Lesson.findById(lessonId).lean();
  if (!lesson) return res.status(404).json({ message: "Leçon introuvable" });

  const course = await Course.findById(lesson.course).lean();
  if (!course) return res.status(404).json({ message: "Cours introuvable" });
  if (String(course.teacher) !== req.user!.id) {
    return res.status(403).json({ message: "Accès refusé" });
  }

  try {
    const questions = await generateQuizQuestions({
      courseTitle: course.title,
      courseDescription: course.description,
      lessonTitle: lesson.title,
      lessonContent: lesson.kind === "text" ? lesson.content : undefined,
      lessonKind: lesson.kind || "text",
      count: n,
      types: cleanTypes,
    });
    res.json({ questions });
  } catch (e: any) {
    console.error("AI generation failed", e);
    res.status(500).json({ message: e.message || "Échec de la génération" });
  }
});

// Gating for final exam: must have passed every chapter exam with ≥60%
router.get("/:id/can-attempt", requireAuth, async (req: AuthRequest, res) => {
  const quiz = await Quiz.findById(req.params.id).lean();
  if (!quiz) return res.status(404).json({ message: "Quiz introuvable" });
  if (quiz.kind !== "final") return res.json({ allowed: true });

  const Chapter = (await import("../models/Chapter.js")).Chapter;
  const chapters = await Chapter.find({ course: quiz.course }).lean();
  if (chapters.length === 0) {
    return res.json({
      allowed: false,
      reason: "Aucun chapitre n'est défini pour ce cours.",
      missing: [],
    });
  }

  const chapterExams = await Quiz.find({
    course: quiz.course,
    kind: "chapter",
  }).lean();

  const missing: { chapter: string; status: "no-exam" | "not-passed"; best?: number }[] = [];

  for (const ch of chapters) {
    const exam = chapterExams.find((q) => String(q.chapter) === String(ch._id));
    if (!exam) {
      missing.push({ chapter: ch.title, status: "no-exam" });
      continue;
    }
    const attempts = await QuizAttempt.find({
      student: req.user!.id,
      quiz: exam._id,
      status: "graded",
    })
      .select("score")
      .lean();
    const best = attempts.reduce((m, a) => Math.max(m, a.score), 0);
    if (best < 60) {
      missing.push({ chapter: ch.title, status: "not-passed", best });
    }
  }

  res.json({ allowed: missing.length === 0, missing });
});

// Check a single answer without persisting an attempt.
// Used for inline per-question feedback during a quiz run.
router.post("/:id/check", requireAuth, async (req, res) => {
  const { questionIndex, answer } = req.body as { questionIndex?: number; answer?: any };
  if (typeof questionIndex !== "number" || questionIndex < 0) {
    return res.status(400).json({ message: "questionIndex invalide" });
  }
  const quiz = await Quiz.findById(req.params.id).lean();
  if (!quiz) return res.status(404).json({ message: "Quiz introuvable" });
  const q = quiz.questions[questionIndex];
  if (!q) return res.status(404).json({ message: "Question introuvable" });

  const type = q.type || "mcq";

  if (type === "text") {
    return res.json({
      type,
      pending: true,
      explanation: q.explanation,
    });
  }

  let isCorrect = false;
  if (type === "mcq") {
    isCorrect = typeof answer === "number" && answer === q.correctIndex;
  } else if (type === "tf") {
    isCorrect = typeof answer === "boolean" && answer === q.correctBool;
  } else if (type === "fill") {
    if (Array.isArray(answer) && q.blanks && q.blanks.length === answer.length) {
      isCorrect = q.blanks.every(
        (b, j) => normalize(b) === normalize(String(answer[j] ?? ""))
      );
    }
  } else if (type === "order") {
    if (Array.isArray(answer) && q.items && q.items.length === answer.length) {
      isCorrect = q.items.every((item, j) => item === answer[j]);
    }
  }

  res.json({
    type,
    isCorrect,
    explanation: q.explanation,
    correctIndex: q.correctIndex,
    correctBool: q.correctBool,
    blanks: q.blanks,
    items: q.items,
  });
});

// Start an attempt — used to anchor the server-side timer for `final` exams.
router.post("/:id/start", requireAuth, async (req: AuthRequest, res) => {
  const quiz = await Quiz.findById(req.params.id).lean();
  if (!quiz) return res.status(404).json({ message: "Quiz introuvable" });
  // We don't persist a "start" record yet — the client just gets a timestamp
  // and the server validates elapsed time on submit against it.
  res.json({ startedAt: new Date().toISOString(), timeLimitSec: quiz.timeLimitSec });
});

// Submit attempt
router.post("/:id/attempt", requireAuth, async (req: AuthRequest, res) => {
  const { answers, startedAt } = req.body as { answers: any[]; startedAt?: string };
  if (!Array.isArray(answers)) return res.status(400).json({ message: "Réponses invalides" });

  const quiz = await Quiz.findById(req.params.id).lean();
  if (!quiz) return res.status(404).json({ message: "Quiz introuvable" });

  // Final-exam gating + timer enforcement
  if (quiz.kind === "final") {
    // Re-check gating server-side
    const Chapter = (await import("../models/Chapter.js")).Chapter;
    const chapters = await Chapter.find({ course: quiz.course }).lean();
    const chapterExams = await Quiz.find({
      course: quiz.course,
      kind: "chapter",
    }).lean();
    for (const ch of chapters) {
      const exam = chapterExams.find((q) => String(q.chapter) === String(ch._id));
      if (!exam) {
        return res.status(403).json({ message: `Chapitre sans examen : ${ch.title}` });
      }
      const attempts = await QuizAttempt.find({
        student: req.user!.id,
        quiz: exam._id,
        status: "graded",
      })
        .select("score")
        .lean();
      const best = attempts.reduce((m, a) => Math.max(m, a.score), 0);
      if (best < 60) {
        return res.status(403).json({
          message: `Vous devez valider tous les examens de chapitre (≥60%). Chapitre incomplet : ${ch.title}.`,
        });
      }
    }
    // Timer
    if (quiz.timeLimitSec && startedAt) {
      const elapsedSec = (Date.now() - new Date(startedAt).getTime()) / 1000;
      if (elapsedSec > quiz.timeLimitSec + 5) {
        return res.status(400).json({
          message: "Temps imparti dépassé. Votre tentative a été refusée.",
        });
      }
    }
  }

  const hasText = quiz.questions.some((q) => q.type === "text");

  let correct = 0;
  const pendingItems: any[] = [];
  const detail = quiz.questions.map((q, i) => {
    const userAnswer = answers[i];
    const type = q.type || "mcq";
    let isCorrect = false;

    if (type === "mcq") {
      isCorrect = typeof userAnswer === "number" && userAnswer === q.correctIndex;
    } else if (type === "tf") {
      isCorrect = typeof userAnswer === "boolean" && userAnswer === q.correctBool;
    } else if (type === "fill") {
      if (Array.isArray(userAnswer) && q.blanks && q.blanks.length === userAnswer.length) {
        isCorrect = q.blanks.every(
          (b, j) => normalize(b) === normalize(String(userAnswer[j] ?? ""))
        );
      }
    } else if (type === "order") {
      if (Array.isArray(userAnswer) && q.items && q.items.length === userAnswer.length) {
        isCorrect = q.items.every((item, j) => item === userAnswer[j]);
      }
    } else if (type === "text") {
      pendingItems.push({
        questionIndex: i,
        userAnswer: typeof userAnswer === "string" ? userAnswer : "",
      });
    }

    if (isCorrect) correct++;

    return {
      type,
      text: q.text,
      options: q.options,
      correctIndex: q.correctIndex,
      correctBool: q.correctBool,
      blanks: q.blanks,
      items: q.items,
      userAnswer,
      isCorrect,
      explanation: q.explanation,
    };
  });

  // Provisional score from auto-graded portion only.
  const autoScore = Math.round((correct / quiz.questions.length) * 100);
  const status = hasText ? "pending" : "graded";

  const attempt = await QuizAttempt.create({
    student: req.user!.id,
    quiz: quiz._id,
    course: quiz.course,
    answers,
    score: autoScore,
    passed: status === "graded" ? autoScore >= quiz.passingScore : false,
    status,
    startedAt: startedAt ? new Date(startedAt) : undefined,
    pendingItems,
  });

  if (status === "pending") {
    // Notify the course teacher that a final-exam attempt needs manual grading.
    try {
      const course = await Course.findById(quiz.course).select("teacher title").lean();
      if (course?.teacher) {
        const student = await (await import("../models/User.js")).User
          .findById(req.user!.id)
          .select("name")
          .lean();
        const { Notification } = await import("../models/Notification.js");
        await Notification.create({
          user: course.teacher,
          kind: "final-pending-grading",
          title: `Examen à corriger : ${quiz.title}`,
          body: `${student?.name || "Un étudiant"} a soumis l'examen final de "${course.title}". Une ou plusieurs questions libres attendent votre correction.`,
          link: `/teach/grading/${attempt._id}`,
        });
      }
    } catch (e) {
      console.error("Failed to notify teacher of pending grading", e);
    }

    // Hide all results until teacher grades the text answers.
    return res.json({
      status: "pending",
      attemptId: attempt._id,
      message:
        "Votre examen a été soumis. Le résultat sera disponible après correction par l'enseignant.",
    });
  }

  res.json({
    status: "graded",
    score: autoScore,
    passed: autoScore >= quiz.passingScore,
    correct,
    total: quiz.questions.length,
    detail,
  });
});

// My attempts for a course
router.get("/attempts/course/:courseId", requireAuth, async (req: AuthRequest, res) => {
  const attempts = await QuizAttempt.find({
    student: req.user!.id,
    course: req.params.courseId,
  })
    .populate("quiz", "title")
    .sort("-createdAt")
    .lean();
  res.json(attempts);
});

// ---- Teacher grading queue ----

// List pending attempts on quizzes whose course this teacher owns.
router.get(
  "/attempts/pending",
  requireAuth,
  requireRole("teacher"),
  async (req: AuthRequest, res) => {
    const myCourses = await Course.find({ teacher: req.user!.id })
      .select("_id title")
      .lean();
    const courseIds = myCourses.map((c) => c._id);
    const attempts = await QuizAttempt.find({
      course: { $in: courseIds },
      status: "pending",
    })
      .populate("student", "name email")
      .populate("quiz", "title kind")
      .sort("-createdAt")
      .lean();
    res.json(attempts);
  }
);

// Get a single attempt for grading — includes question + student answers + reference.
router.get(
  "/attempts/:attemptId",
  requireAuth,
  requireRole("teacher"),
  async (req: AuthRequest, res) => {
    const attempt = await QuizAttempt.findById(req.params.attemptId)
      .populate("student", "name email")
      .populate("quiz")
      .lean();
    if (!attempt) return res.status(404).json({ message: "Tentative introuvable" });
    const course = await Course.findById(attempt.course);
    if (!course) return res.status(404).json({ message: "Cours introuvable" });
    if (String(course.teacher) !== req.user!.id) {
      return res.status(403).json({ message: "Accès refusé" });
    }
    res.json(attempt);
  }
);

// Submit grades for the pending text questions of a final-exam attempt.
// Body: { items: [{ questionIndex, awardedPoints (0..1), comment? }] }
router.post(
  "/attempts/:attemptId/grade",
  requireAuth,
  requireRole("teacher"),
  async (req: AuthRequest, res) => {
    const { items } = req.body as {
      items?: { questionIndex: number; awardedPoints: number; comment?: string }[];
    };
    if (!Array.isArray(items)) return res.status(400).json({ message: "items requis" });

    const attempt = await QuizAttempt.findById(req.params.attemptId);
    if (!attempt) return res.status(404).json({ message: "Tentative introuvable" });
    const course = await Course.findById(attempt.course);
    if (!course) return res.status(404).json({ message: "Cours introuvable" });
    if (String(course.teacher) !== req.user!.id) {
      return res.status(403).json({ message: "Accès refusé" });
    }
    if (attempt.status === "graded") {
      return res.status(400).json({ message: "Tentative déjà notée." });
    }

    const quiz = await Quiz.findById(attempt.quiz).lean();
    if (!quiz) return res.status(404).json({ message: "Quiz introuvable" });

    // Merge teacher grades into pendingItems
    const byIndex = new Map<number, { awardedPoints: number; comment?: string }>();
    for (const it of items) {
      if (typeof it.questionIndex !== "number") continue;
      const pts = Math.max(0, Math.min(1, Number(it.awardedPoints) || 0));
      byIndex.set(it.questionIndex, { awardedPoints: pts, comment: it.comment });
    }
    const merged = attempt.pendingItems.map((p: any) => {
      const grade = byIndex.get(p.questionIndex);
      const base = typeof p.toObject === "function" ? p.toObject() : p;
      return grade
        ? { ...base, awardedPoints: grade.awardedPoints, comment: grade.comment }
        : base;
    });

    // Recompute total: previous auto-graded correct count + teacher-awarded fractions
    const total = quiz.questions.length;
    // Auto-graded correct (everything that wasn't a text question and was scored correct)
    // attempt.score is the auto-graded score as a percentage; convert back to count.
    const autoCorrectApprox = Math.round((attempt.score / 100) * total);

    const textAwarded = merged.reduce(
      (sum: number, p: any) => sum + (typeof p.awardedPoints === "number" ? p.awardedPoints : 0),
      0
    );
    const finalScore = Math.round(((autoCorrectApprox + textAwarded) / total) * 100);

    attempt.pendingItems = merged as any;
    attempt.score = finalScore;
    attempt.passed = finalScore >= quiz.passingScore;
    attempt.status = "graded";
    attempt.gradedBy = req.user!.id as any;
    attempt.gradedAt = new Date();
    await attempt.save();

    // Notify the student
    const { Notification } = await import("../models/Notification.js");
    await Notification.create({
      user: attempt.student,
      kind: "final-graded",
      title: `Examen corrigé : ${quiz.title}`,
      body: `Votre score : ${finalScore}% — ${attempt.passed ? "Réussi" : "Non validé"}.`,
      link: `/courses/${attempt.course}`,
    });

    res.json({ ok: true, score: finalScore, passed: attempt.passed });
  }
);

export default router;
