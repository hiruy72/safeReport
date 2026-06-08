import { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand, DeleteObjectCommand, DeleteObjectsCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import { env } from "../config/env";
import { encryptBuffer, decryptBuffer } from "./crypto";

const s3Client = new S3Client({
  region: env.s3.region,
  credentials:
    env.s3.accessKeyId && env.s3.secretAccessKey
      ? { accessKeyId: env.s3.accessKeyId, secretAccessKey: env.s3.secretAccessKey }
      : undefined,
});

export async function saveEncryptedFile(buffer: Buffer, originalName: string): Promise<string> {
  const ext = path.extname(originalName) || ".bin";
  const fileKey = `${uuidv4()}${ext}.enc`;
  const encrypted = encryptBuffer(buffer);

  await s3Client.send(
    new PutObjectCommand({
      Bucket: env.s3.bucket,
      Key: fileKey,
      Body: encrypted,
    })
  );
  return fileKey;
}

export async function readEncryptedFile(fileKey: string): Promise<Buffer> {
  const res = await s3Client.send(
    new GetObjectCommand({
      Bucket: env.s3.bucket,
      Key: fileKey,
    })
  );
  if (!res.Body) throw new Error("File not found in S3");
  
  const raw = Buffer.from(await res.Body.transformToByteArray());
  
  if (fileKey.endsWith(".enc")) {
    return decryptBuffer(raw);
  }
  return raw;
}

export function getEncryptedFilePath(fileKey: string): string {
  return `s3://${env.s3.bucket}/${fileKey}`;
}

export async function fileExists(fileKey: string): Promise<boolean> {
  try {
    await s3Client.send(
      new HeadObjectCommand({
        Bucket: env.s3.bucket,
        Key: fileKey,
      })
    );
    return true;
  } catch {
    return false;
  }
}

export async function deleteFile(fileKey: string): Promise<void> {
  try {
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: env.s3.bucket,
        Key: fileKey,
      })
    );
  } catch (err) {
    console.error(`[S3] Failed to delete file ${fileKey}:`, err);
  }
}

export async function deleteFiles(fileKeys: string[]): Promise<void> {
  if (fileKeys.length === 0) return;
  try {
    await s3Client.send(
      new DeleteObjectsCommand({
        Bucket: env.s3.bucket,
        Delete: {
          Objects: fileKeys.map((Key) => ({ Key })),
          Quiet: true,
        },
      })
    );
  } catch (err) {
    console.error(`[S3] Failed to delete files:`, err);
  }
}
