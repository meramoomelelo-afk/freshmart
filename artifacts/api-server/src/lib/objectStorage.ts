import { Storage } from "@google-cloud/storage";
import { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
import type { Response } from "express";
import { Readable } from "stream";

const REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";

const isR2 = !!(process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY && process.env.R2_BUCKET_NAME);

let r2Client: S3Client | null = null;
function getR2(): S3Client {
  if (!r2Client) {
    r2Client = new S3Client({
      region: "auto",
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    });
  }
  return r2Client;
}

let gcsClient: Storage | null = null;
function getGCS(): Storage {
  if (!gcsClient) {
    gcsClient = new Storage({
      credentials: {
        audience: "replit",
        subject_token_type: "access_token",
        token_url: `${REPLIT_SIDECAR_ENDPOINT}/token`,
        type: "external_account",
        credential_source: {
          url: `${REPLIT_SIDECAR_ENDPOINT}/credential`,
          format: { type: "json", subject_token_field_name: "access_token" },
        },
        universe_domain: "googleapis.com",
      } as any,
      projectId: "",
    });
  }
  return gcsClient;
}

export const objectStorageClient = {
  bucket(name: string) {
    return getGCS().bucket(name);
  },
};

export class ObjectStorageService {
  getPrivateObjectDir(): string {
    const dir = process.env.PRIVATE_OBJECT_DIR || "";
    if (!dir) throw new Error("PRIVATE_OBJECT_DIR not set");
    return dir;
  }
  parsePath(path: string): { bucketName: string; objectName: string } {
    if (!path.startsWith("/")) path = `/${path}`;
    const parts = path.split("/");
    if (parts.length < 3) throw new Error("Invalid path");
    return { bucketName: parts[1], objectName: parts.slice(2).join("/") };
  }
}

export type UploadResult = { url: string; filename: string };

export const imageStorage = {
  isR2,

  async upload(buffer: Buffer, contentType: string): Promise<UploadResult> {
    const ext = contentType.split("/")[1] === "jpeg" ? "jpg" : contentType.split("/")[1];
    const filename = `product-images/${randomUUID()}.${ext}`;

    if (isR2) {
      const bucket = process.env.R2_BUCKET_NAME!;
      await getR2().send(new PutObjectCommand({
        Bucket: bucket,
        Key: filename,
        Body: buffer,
        ContentType: contentType,
        CacheControl: "public, max-age=31536000",
      }));
      const publicBase = (process.env.R2_PUBLIC_URL || "").replace(/\/$/, "");
      const url = publicBase ? `${publicBase}/${filename}` : `/api/uploads/${filename.replace("product-images/", "")}`;
      return { url, filename };
    }

    const svc = new ObjectStorageService();
    const fullPath = `${svc.getPrivateObjectDir()}/${filename}`;
    const { bucketName, objectName } = svc.parsePath(fullPath);
    const bucket = getGCS().bucket(bucketName);
    await bucket.file(objectName).save(buffer, {
      contentType,
      metadata: { cacheControl: "public, max-age=31536000" },
    });
    return { url: `/api/uploads/${filename.replace("product-images/", "")}`, filename };
  },

  async serve(file: string, res: Response): Promise<void> {
    if (!file || /[\/\\]/.test(file)) { res.status(400).json({ error: "Bad Request" }); return; }
    const key = `product-images/${file}`;

    if (isR2) {
      try {
        const bucket = process.env.R2_BUCKET_NAME!;
        const head = await getR2().send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
        const contentType = head.ContentType || "application/octet-stream";
        if (!contentType.startsWith("image/")) { res.status(403).json({ error: "Forbidden" }); return; }
        const obj = await getR2().send(new GetObjectCommand({ Bucket: bucket, Key: key }));
        res.setHeader("Content-Type", contentType);
        res.setHeader("Cache-Control", "public, max-age=31536000");
        (obj.Body as Readable).pipe(res);
      } catch {
        res.status(404).json({ error: "Not Found" });
      }
      return;
    }

    const svc = new ObjectStorageService();
    const fullPath = `${svc.getPrivateObjectDir()}/${key}`;
    const { bucketName, objectName } = svc.parsePath(fullPath);
    const fileRef = getGCS().bucket(bucketName).file(objectName);
    const [exists] = await fileRef.exists();
    if (!exists) { res.status(404).json({ error: "Not Found" }); return; }
    const [metadata] = await fileRef.getMetadata();
    const contentType = (metadata.contentType as string) || "application/octet-stream";
    if (!contentType.startsWith("image/")) { res.status(403).json({ error: "Forbidden" }); return; }
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=31536000");
    fileRef.createReadStream().pipe(res);
  },
};
