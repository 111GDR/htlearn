import { Router } from "express";
import { Types } from "mongoose";
import { Bookmark } from "../models/Bookmark.js";
import { Course } from "../models/Course.js";
import { AuthRequest, requireAuth } from "../middleware/auth.js";

const router = Router();

// My bookmarks (with the bookmarked course populated)
router.get("/", requireAuth, async (req: AuthRequest, res) => {
  const bookmarks = await Bookmark.find({ student: req.user!.id })
    .sort("-createdAt")
    .populate({
      path: "course",
      populate: { path: "teacher", select: "name avatar" },
    })
    .lean();
  // Drop bookmarks whose course was deleted
  res.json(bookmarks.filter((b) => b.course));
});

// Quick map of "is this course bookmarked by me" — IDs only.
router.get("/ids", requireAuth, async (req: AuthRequest, res) => {
  const docs = await Bookmark.find({ student: req.user!.id })
    .select("course")
    .lean();
  res.json({ ids: docs.map((d) => String(d.course)) });
});

router.post("/:courseId", requireAuth, async (req: AuthRequest, res) => {
  if (!Types.ObjectId.isValid(req.params.courseId)) {
    return res.status(400).json({ message: "ID de cours invalide" });
  }
  const course = await Course.findById(req.params.courseId).lean();
  if (!course) return res.status(404).json({ message: "Cours introuvable" });
  try {
    const bookmark = await Bookmark.create({
      student: req.user!.id,
      course: course._id,
    });
    res.status(201).json({ bookmark });
  } catch (e: any) {
    if (e?.code === 11000) {
      return res.status(200).json({ ok: true, alreadyBookmarked: true });
    }
    throw e;
  }
});

router.delete("/:courseId", requireAuth, async (req: AuthRequest, res) => {
  await Bookmark.deleteOne({
    student: req.user!.id,
    course: req.params.courseId,
  });
  res.json({ ok: true });
});

export default router;
