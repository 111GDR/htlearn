import { Schema, model, Document, Types } from "mongoose";

export type AuditAction =
  | "user.create"
  | "user.update"
  | "user.delete"
  | "user.reset-password"
  | "user.disable"
  | "user.enable"
  | "user.import"
  | "report.update"
  | "report.delete"
  | "course.delete"; // emitted from the courses route when an admin deletes

export interface IAuditLog extends Document {
  _id: Types.ObjectId;
  actor: Types.ObjectId;
  actorName: string;
  action: AuditAction;
  targetType: "user" | "report" | "course" | "other";
  targetId?: string;
  targetLabel?: string; // e.g. user email, course title — kept inline so display survives target deletion
  meta?: Record<string, any>;
  ip?: string;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    actor: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    actorName: { type: String, required: true },
    action: { type: String, required: true, index: true },
    targetType: {
      type: String,
      enum: ["user", "report", "course", "other"],
      required: true,
    },
    targetId: { type: String },
    targetLabel: { type: String },
    meta: { type: Schema.Types.Mixed },
    ip: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

auditLogSchema.index({ createdAt: -1 });

export const AuditLog = model<IAuditLog>("AuditLog", auditLogSchema);
