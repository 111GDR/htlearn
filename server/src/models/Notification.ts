import { Schema, model, Document, Types } from "mongoose";

export type NotificationKind =
  | "final-graded"
  | "final-pending-grading"
  | "report-resolved"
  | "report-dismissed";

export interface INotification extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  kind: NotificationKind;
  title: string;
  body?: string;
  link?: string;
  read: boolean;
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    kind: {
      type: String,
      enum: ["final-graded", "final-pending-grading", "report-resolved", "report-dismissed"],
      required: true,
    },
    title: { type: String, required: true },
    body: { type: String },
    link: { type: String },
    read: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

export const Notification = model<INotification>("Notification", notificationSchema);
