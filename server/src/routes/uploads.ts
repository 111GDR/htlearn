import { Router } from "express";
import multer from "multer";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { storeBuffer } from "../lib/storage.js";
import { transcribeAudio, WHISPER_MAX_BYTES } from "../lib/groq.js";

const router = Router();

const ACCEPTED: Record<string, RegExp> = {
  image: /^image\/(png|jpe?g|webp|gif)$/,
  pdf: /^application\/pdf$/,
  video: /^video\/(mp4|webm|ogg|quicktime)$/,
  audio: /^audio\/(mpeg|mp3|wav|ogg|webm|m4a|x-m4a|aac)$/,
};

const MAX_SIZE: Record<string, number> = {
  image: 5 * 1024 * 1024,
  pdf: 25 * 1024 * 1024,
  video: 200 * 1024 * 1024,
  audio: 50 * 1024 * 1024,
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 200 * 1024 * 1024 },
});

const handleUpload = (kind: keyof typeof ACCEPTED) => [
  requireAuth,
  requireRole("teacher", "admin"),
  upload.single("file"),
  async (req: any, res: any) => {
    const file = req.file;
    if (!file) return res.status(400).json({ message: "Aucun fichier reçu" });
    if (!ACCEPTED[kind].test(file.mimetype)) {
      return res.status(400).json({ message: `Format ${kind} non supporté` });
    }
    if (file.size > MAX_SIZE[kind]) {
      return res
        .status(400)
        .json({ message: `Fichier trop volumineux (max ${Math.round(MAX_SIZE[kind] / 1024 / 1024)} Mo)` });
    }
    try {
      const url = await storeBuffer(file.buffer, file.originalname, file.mimetype);
      const response: any = { url };

      if (kind === "video" || kind === "audio") {
        if (file.size <= WHISPER_MAX_BYTES) {
          try {
            response.transcript = await transcribeAudio(
              file.buffer,
              file.originalname,
              file.mimetype
            );
          } catch (e: any) {
            console.error("Transcription failed", e);
            response.transcriptError = e.message || "Échec de la transcription automatique";
          }
        } else {
          response.transcriptError =
            "Fichier trop volumineux pour la transcription automatique (max 25 Mo)";
        }
      }

      res.status(201).json(response);
    } catch (e: any) {
      console.error("upload failed", e);
      res.status(500).json({ message: "Échec de l'upload" });
    }
  },
];

router.post("/image", ...handleUpload("image"));
router.post("/pdf", ...handleUpload("pdf"));
router.post("/video", ...handleUpload("video"));
router.post("/audio", ...handleUpload("audio"));

// Avatar upload — open to any logged-in user (capped at 2 MB).
router.post(
  "/avatar",
  requireAuth,
  upload.single("file"),
  async (req: any, res: any) => {
    const file = req.file;
    if (!file) return res.status(400).json({ message: "Aucun fichier reçu" });
    if (!ACCEPTED.image.test(file.mimetype)) {
      return res.status(400).json({ message: "Format d'image non supporté (PNG, JPG, WEBP, GIF)" });
    }
    if (file.size > 2 * 1024 * 1024) {
      return res.status(400).json({ message: "Image trop volumineuse (max 2 Mo)" });
    }
    try {
      const url = await storeBuffer(file.buffer, file.originalname, file.mimetype);
      res.status(201).json({ url });
    } catch (e) {
      console.error("avatar upload failed", e);
      res.status(500).json({ message: "Échec de l'upload" });
    }
  }
);

export default router;
