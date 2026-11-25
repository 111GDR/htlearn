import { Router } from "express";
import { z } from "zod";
import { Course } from "../models/Course.js";
import { AuthRequest, requireAuth, requireRole } from "../middleware/auth.js";
import { generateFlashcards } from "../lib/groq.js";

const router = Router();

const generateSchema = z.object({
  courseId: z.string(),
  lessonTitle: z.string().min(1),
  content: z.string().min(50, "Le contenu de la leçon est trop court pour générer des flashcards utiles."),
});

router.post(
  "/generate",
  requireAuth,
  requireRole("teacher", "admin"),
  async (req: AuthRequest, res) => {
    const parsed = generateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ message: parsed.error.issues[0]?.message || "Données invalides" });
    }

    const course = await Course.findById(parsed.data.courseId).lean();
    if (!course) return res.status(404).json({ message: "Cours introuvable" });
    if (String(course.teacher) !== req.user!.id && req.user!.role !== "admin") {
      return res.status(403).json({ message: "Accès refusé" });
    }

    try {
      const flashcards = await generateFlashcards({
        courseTitle: course.title,
        lessonTitle: parsed.data.lessonTitle,
        lessonContent: parsed.data.content,
      });
      res.json({ flashcards });
    } catch (e: any) {
      console.error("Flashcard generation failed", e);
      res.status(500).json({ message: e.message || "Échec de la génération" });
    }
  }
);

export default router;
