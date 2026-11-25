import type { Request } from "express";
import { AuditLog, AuditAction } from "../models/AuditLog.js";
import type { AuthRequest } from "../middleware/auth.js";

/**
 * Append an entry to the admin audit log. Best-effort: failures are logged
 * but never thrown so they can't break the action being audited.
 */
export const logAudit = async (
  req: AuthRequest | Request,
  entry: {
    action: AuditAction;
    targetType: "user" | "report" | "course" | "other";
    targetId?: string;
    targetLabel?: string;
    meta?: Record<string, any>;
  }
) => {
  const r = req as AuthRequest;
  if (!r.user) return;
  try {
    await AuditLog.create({
      actor: r.user.id,
      actorName: r.user.name || r.user.email,
      action: entry.action,
      targetType: entry.targetType,
      targetId: entry.targetId,
      targetLabel: entry.targetLabel,
      meta: entry.meta,
      ip: req.ip,
    });
  } catch (e) {
    console.error("audit log write failed", e);
  }
};
