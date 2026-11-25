import fs from "fs";
import path from "path";
import crypto from "crypto";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const {
  R2_ACCOUNT_ID,
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_BUCKET,
  R2_PUBLIC_URL,
} = process.env;

const r2Configured = Boolean(
  R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_BUCKET && R2_PUBLIC_URL
);

let r2Client: S3Client | null = null;
if (r2Configured) {
  r2Client = new S3Client({
    region: "auto",
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID!,
      secretAccessKey: R2_SECRET_ACCESS_KEY!,
    },
  });
  console.log("📦 R2 storage configured");
} else {
  console.log("📦 R2 not configured — using local /uploads");
}

const localDir = path.resolve("uploads");
fs.mkdirSync(localDir, { recursive: true });

export const isR2 = () => r2Configured;

export const storeBuffer = async (
  buffer: Buffer,
  originalName: string,
  mimetype: string
): Promise<string> => {
  const ext = path.extname(originalName).toLowerCase() || "";
  const key = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`;

  if (r2Client) {
    await r2Client.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET!,
        Key: key,
        Body: buffer,
        ContentType: mimetype,
      })
    );
    const base = R2_PUBLIC_URL!.replace(/\/$/, "");
    return `${base}/${key}`;
  }

  const filePath = path.join(localDir, key);
  await fs.promises.writeFile(filePath, buffer);
  return `/uploads/${key}`;
};
