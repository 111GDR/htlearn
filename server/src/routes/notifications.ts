import { Router } from "express";
import { Notification } from "../models/Notification.js";
import { AuthRequest, requireAuth } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth);

// List my notifications (latest 50)
router.get("/", async (req: AuthRequest, res) => {
  const list = await Notification.find({ user: req.user!.id })
    .sort("-createdAt")
    .limit(50)
    .lean();
  res.json(list);
});

// Unread count (cheap)
router.get("/unread-count", async (req: AuthRequest, res) => {
  const count = await Notification.countDocuments({ user: req.user!.id, read: false });
  res.json({ count });
});

// Mark one as read
router.post("/:id/read", async (req: AuthRequest, res) => {
  const n = await Notification.findOne({ _id: req.params.id, user: req.user!.id });
  if (!n) return res.status(404).json({ message: "Notification introuvable" });
  n.read = true;
  await n.save();
  res.json({ ok: true });
});

// Mark all as read
router.post("/read-all", async (req: AuthRequest, res) => {
  await Notification.updateMany({ user: req.user!.id, read: false }, { $set: { read: true } });
  res.json({ ok: true });
});

export default router;
