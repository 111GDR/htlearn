import { Schema, model, Document, Types } from "mongoose";

export type LessonKind = "text" | "pdf" | "video" | "audio";
export type MediaSource = "upload" | "url";

export interface IFlashcard {
  front: string;
  back: string;
}

export interface ILesson extends Document {
  _id: Types.ObjectId;
  course: Types.ObjectId;
  chapter?: Types.ObjectId;
  title: string;
  kind: LessonKind;
  content: string;
  mediaUrl?: string;
  mediaSource?: MediaSource;
  transcript?: string;
  flashcards: IFlashcard[];
  order: number;
  duration?: number;
  createdAt: Date;
}

const flashcardSchema = new Schema<IFlashcard>(
  {
    front: { type: String, required: true },
    back: { type: String, required: true },
  },
  { _id: false }
);

const lessonSchema = new Schema<ILesson>(
  {
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    chapter: { type: Schema.Types.ObjectId, ref: "Chapter", index: true },
    title: { type: String, required: true },
    kind: { type: String, enum: ["text", "pdf", "video", "audio"], default: "text" },
    content: { type: String, default: "" },
    mediaUrl: { type: String },
    mediaSource: { type: String, enum: ["upload", "url"] },
    transcript: { type: String },
    flashcards: { type: [flashcardSchema], default: [] },
    order: { type: Number, default: 0 },
    duration: { type: Number },
  },
  { timestamps: true }
);

export const Lesson = model<ILesson>("Lesson", lessonSchema);
