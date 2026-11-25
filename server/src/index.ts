import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import mongoose from "mongoose";
import path from "path";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import authRoutes from "./routes/auth.js";
import courseRoutes from "./routes/courses.js";
import chapterRoutes from "./routes/chapters.js";
import lessonRoutes from "./routes/lessons.js";
import quizRoutes from "./routes/quizzes.js";
import enrollmentRoutes from "./routes/enrollments.js";
import statsRoutes from "./routes/stats.js";
import uploadRoutes from "./routes/uploads.js";
import tutorRoutes from "./routes/tutor.js";
import flashcardRoutes from "./routes/flashcards.js";
import adminRoutes from "./routes/admin.js";
import reportRoutes from "./routes/reports.js";
import notificationRoutes from "./routes/notifications.js";
import reviewRoutes from "./routes/reviews.js";
import bookmarkRoutes from "./routes/bookmarks.js";

const app = express();

// Trust the reverse proxy (Nginx in Docker) so req.ip reflects the real
// client address — required for express-rate-limit to key per-IP correctly.
app.set("trust proxy", 1);

// Security headers. `crossOriginResourcePolicy` is relaxed so the
// Vite dev server and Nginx can serve /uploads to the SPA on a different port.
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false, // CSP would need fine tuning for the React app + Groq + R2
  })
);

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173", credentials: true }));
app.use(express.json({ limit: "5mb" }));
app.use(morgan("dev"));

app.use("/uploads", express.static(path.resolve("uploads")));

// Global API floor: keeps any single IP from hammering the backend.
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 240, // 4 req/sec sustained
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { message: "Trop de requêtes. Réessayez dans une minute." },
});
app.use("/api", apiLimiter);

// Tight limit on credentialed auth endpoints to slow brute-force attempts.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    message: "Trop de tentatives. Réessayez dans quelques minutes.",
  },
});
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/forgot-password", authLimiter);
app.use("/api/auth/reset-password", authLimiter);

app.get("/api/health", (_req, res) => res.json({ ok: true, time: new Date().toISOString() }));

app.use("/api/auth", authRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/chapters", chapterRoutes);
app.use("/api/lessons", lessonRoutes);
app.use("/api/quizzes", quizRoutes);
app.use("/api/enrollments", enrollmentRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/tutor", tutorRoutes);
app.use("/api/flashcards", flashcardRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/bookmarks", bookmarkRoutes);

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ message: err.message || "Erreur serveur" });
});

const PORT = Number(process.env.PORT) || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/elearning";

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connecté");
    app.listen(PORT, () => console.log(`🚀 Serveur sur http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error("❌ MongoDB erreur:", err);
    process.exit(1);
  });
