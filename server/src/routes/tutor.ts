import { Router } from "express";
import { z } from "zod";
import { Lesson } from "../models/Lesson.js";
import { Course } from "../models/Course.js";
import { AuthRequest, requireAuth } from "../middleware/auth.js";
import { chatWithTutor } from "../lib/groq.js";

const router = Router();

const chatSchema = z.object({
  lessonId: z.string(),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(2000),
      })
    )
    .min(1)
    .max(30),
});

router.post("/chat", requireAuth, async (req: AuthRequest, res) => {
  const parsed = chatSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Données invalides" });

  const lesson = await Lesson.findById(parsed.data.lessonId).lean();
  if (!lesson) return res.status(404).json({ message: "Leçon introuvable" });

  // The tutor only grounds on Markdown content. Video, audio and PDF lessons
  // aren't supported — the model can't see media and PDF text isn't extracted.
  if (lesson.kind && lesson.kind !== "text") {
    return res.status(400).json({
      message:
        "L'assistant IA n'est disponible que pour les leçons en format texte.",
      code: "TUTOR_UNAVAILABLE",
    });
  }

  const course = await Course.findById(lesson.course).lean();
  if (!course) return res.status(404).json({ message: "Cours introuvable" });

  try {
    const reply = await chatWithTutor({
      courseTitle: course.title,
      lessonTitle: lesson.title,
      lessonContent: lesson.content,
      history: parsed.data.messages,
    });
    res.json({ reply });
  } catch (e: any) {
    console.error("Tutor chat failed", e);
    res.status(500).json({ message: e.message || "Erreur du tuteur IA" });
  }
});

export default router;
