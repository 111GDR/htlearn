import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { User, UserRole } from "../models/User.js";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: UserRole;
    name: string;
    email: string;
    mustChangePassword: boolean;
  };
}

// Endpoints reachable while mustChangePassword=true. Everything else is blocked
// server-side so the client can't simply skip the change-password screen.
const PASSWORD_GATE_ALLOWLIST = new Set([
  "GET:/api/auth/me",
  "POST:/api/auth/change-password",
  "POST:/api/auth/logout",
]);

export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Non authentifié" });
    }
    const token = header.slice(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
    const user = await User.findById(decoded.id).lean();
    if (!user) return res.status(401).json({ message: "Utilisateur introuvable" });
    if (user.disabled) {
      return res.status(403).json({
        message: "Ce compte a été désactivé.",
        code: "ACCOUNT_DISABLED",
      });
    }
    req.user = {
      id: String(user._id),
      role: user.role,
      name: user.name,
      email: user.email,
      mustChangePassword: !!user.mustChangePassword,
    };

    if (user.mustChangePassword) {
      const key = `${req.method}:${req.baseUrl}${req.path}`.replace(/\/+$/, "");
      const allowed = Array.from(PASSWORD_GATE_ALLOWLIST).some((entry) => {
        const normalized = entry.replace(/\/+$/, "");
        return key === normalized;
      });
      if (!allowed) {
        return res.status(403).json({
          message: "Vous devez d'abord changer votre mot de passe.",
          code: "PASSWORD_CHANGE_REQUIRED",
        });
      }
    }

    next();
  } catch {
    return res.status(401).json({ message: "Token invalide" });
  }
};

export const requireRole = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Accès refusé" });
    }
    next();
  };
};
