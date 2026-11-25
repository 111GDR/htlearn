import { Schema, model, Document, Types } from "mongoose";

export type QuestionType = "mcq" | "tf" | "fill" | "order" | "text";
export type QuizKind = "practice" | "chapter" | "final";
export type QuestionMediaKind = "text" | "pdf" | "video" | "audio";
export type QuestionMediaSource = "upload" | "url";

export interface IQuestionMedia {
  kind: QuestionMediaKind;
  url: string;
  source?: QuestionMediaSource;
}

export interface IQuestion {
  type: QuestionType;
  text: string;
  // mcq
  options?: string[];
  correctIndex?: number;
  // tf
  correctBool?: boolean;
  // fill: text contains "___" placeholders, blanks holds expected answers in order
  blanks?: string[];
  // order: items in correct order (will be shuffled for the student)
  items?: string[];
  // text (Phase 2 — only valid on `final` quizzes; teacher-graded)
  expectedAnswer?: string;
  explanation?: string;
  media?: IQuestionMedia;
}

export interface IQuiz extends Document {
  _id: Types.ObjectId;
  kind: QuizKind;
  lesson?: Types.ObjectId;
  chapter?: Types.ObjectId;
  course: Types.ObjectId;
  title: string;
  questions: IQuestion[];
  passingScore: number;
  /** Final-exam time limit in seconds. Optional, used for `kind: "final"` only. */
  timeLimitSec?: number;
  createdAt: Date;
}

const mediaSchema = new Schema<IQuestionMedia>(
  {
    kind: { type: String, enum: ["text", "pdf", "video", "audio"], required: true },
    url: { type: String, required: true },
    source: { type: String, enum: ["upload", "url"] },
  },
  { _id: false }
);

const questionSchema = new Schema<IQuestion>(
  {
    type: { type: String, enum: ["mcq", "tf", "fill", "order", "text"], default: "mcq" },
    text: { type: String, required: true },
    options: { type: [String] },
    correctIndex: { type: Number },
    correctBool: { type: Boolean },
    blanks: { type: [String] },
    items: { type: [String] },
    expectedAnswer: { type: String },
    explanation: { type: String },
    media: { type: mediaSchema, required: false },
  },
  { _id: false }
);

const quizSchema = new Schema<IQuiz>(
  {
    kind: {
      type: String,
      enum: ["practice", "chapter", "final"],
      default: "practice",
      index: true,
    },
    lesson: { type: Schema.Types.ObjectId, ref: "Lesson", index: true },
    chapter: { type: Schema.Types.ObjectId, ref: "Chapter", index: true },
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    title: { type: String, required: true },
    questions: { type: [questionSchema], default: [] },
    passingScore: { type: Number, default: 60 },
    timeLimitSec: { type: Number },
  },
  { timestamps: true }
);

export const Quiz = model<IQuiz>("Quiz", quizSchema);
