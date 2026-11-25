import { Schema, model, Document, Types } from "mongoose";
import bcrypt from "bcryptjs";

export type UserRole = "admin" | "teacher" | "student";

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  studentId?: string;
  grade?: string;
  mustChangePassword: boolean;
  disabled: boolean;
  disabledAt?: Date | null;
  disabledReason?: string;
  passwordResetTokenHash?: string | null;
  passwordResetExpires?: Date | null;
  avatar?: string;
  bio?: string;
  createdAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    role: { type: String, enum: ["admin", "teacher", "student"], default: "student" },
    studentId: { type: String, trim: true, sparse: true },
    grade: { type: String, trim: true },
    mustChangePassword: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false, index: true },
    disabledAt: { type: Date, default: null },
    disabledReason: { type: String },
    passwordResetTokenHash: { type: String, default: null },
    passwordResetExpires: { type: Date, default: null },
    avatar: { type: String },
    bio: { type: String },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function (candidate: string) {
  return bcrypt.compare(candidate, this.password);
};

export const User = model<IUser>("User", userSchema);
