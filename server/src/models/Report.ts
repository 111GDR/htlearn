import { Schema, model, Document, Types } from "mongoose";

export type ReportTargetType = "user" | "course" | "lesson" | "quiz" | "other";
export type ReportStatus = "open" | "resolved" | "dismissed";

export interface IReport extends Document {
  _id: Types.ObjectId;
  reporter: Types.ObjectId;
  targetType: ReportTargetType;
  targetId?: Types.ObjectId;
  reason: string;
  message?: string;
  status: ReportStatus;
  resolution?: string;
  resolvedBy?: Types.ObjectId;
  resolvedAt?: Date;
  createdAt: Date;
}

const reportSchema = new Schema<IReport>(
  {
    reporter: { type: Schema.Types.ObjectId, ref: "User", required: true },
    targetType: {
      type: String,
      enum: ["user", "course", "lesson", "quiz", "other"],
      required: true,
    },
    targetId: { type: Schema.Types.ObjectId },
    reason: { type: String, required: true, trim: true },
    message: { type: String, trim: true },
    status: { type: String, enum: ["open", "resolved", "dismissed"], default: "open" },
    resolution: { type: String, trim: true },
    resolvedBy: { type: Schema.Types.ObjectId, ref: "User" },
    resolvedAt: { type: Date },
  },
  { timestamps: true }
);

export const Report = model<IReport>("Report", reportSchema);
