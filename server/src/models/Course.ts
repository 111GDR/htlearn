import { Schema, model, Document, Types } from "mongoose";

export interface ICourse extends Document {
  _id: Types.ObjectId;
  title: string;
  description: string;
  category: string;
  level: "Débutant" | "Intermédiaire" | "Avancé";
  thumbnail?: string;
  teacher: Types.ObjectId;
  published: boolean;
  createdAt: Date;
}

const courseSchema = new Schema<ICourse>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    level: { type: String, enum: ["Débutant", "Intermédiaire", "Avancé"], default: "Débutant" },
    thumbnail: { type: String },
    teacher: { type: Schema.Types.ObjectId, ref: "User", required: true },
    published: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Course = model<ICourse>("Course", courseSchema);
