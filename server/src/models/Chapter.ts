import { Schema, model, Document, Types } from "mongoose";

export interface IChapter extends Document {
  _id: Types.ObjectId;
  course: Types.ObjectId;
  title: string;
  description?: string;
  order: number;
  createdAt: Date;
}

const chapterSchema = new Schema<IChapter>(
  {
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Chapter = model<IChapter>("Chapter", chapterSchema);
