import { Schema, model, Document, Types } from "mongoose";

export type AttemptAnswer = number | boolean | string | string[] | null;
export type AttemptStatus = "graded" | "pending";

export interface IPendingItem {
  questionIndex: number;
  userAnswer: string;
  awardedPoints?: number; // 0..1 (fraction of one question worth) — set by teacher
  comment?: string;
}

export interface IQuizAttempt extends Document {
  _id: Types.ObjectId;
  student: Types.ObjectId;
  quiz: Types.ObjectId;
  course: Types.ObjectId;
  answers: AttemptAnswer[];
  /** Score from auto-graded portion. Final score, once graded, is stored here too. */
  score: number;
  passed: boolean;
  status: AttemptStatus;
  startedAt?: Date;
  pendingItems: IPendingItem[];
  gradedBy?: Types.ObjectId;
  gradedAt?: Date;
  createdAt: Date;
}

const pendingItemSchema = new Schema<IPendingItem>(
  {
    questionIndex: { type: Number, required: true },
    userAnswer: { type: String, default: "" },
    awardedPoints: { type: Number },
    comment: { type: String },
  },
  { _id: false }
);

const attemptSchema = new Schema<IQuizAttempt>(
  {
    student: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    quiz: { type: Schema.Types.ObjectId, ref: "Quiz", required: true, index: true },
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    answers: [{ type: Schema.Types.Mixed }],
    score: { type: Number, required: true },
    passed: { type: Boolean, default: false },
    status: { type: String, enum: ["graded", "pending"], default: "graded", index: true },
    startedAt: { type: Date },
    pendingItems: { type: [pendingItemSchema], default: [] },
    gradedBy: { type: Schema.Types.ObjectId, ref: "User" },
    gradedAt: { type: Date },
  },
  { timestamps: true }
);

export const QuizAttempt = model<IQuizAttempt>("QuizAttempt", attemptSchema);
