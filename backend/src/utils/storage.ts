import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "../config/env";

let client: S3Client | null = null;

function getClient(): S3Client {
  if (!env.R2_ACCOUNT_ID || !env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY) {
    throw new Error("R2 storage is not configured (missing R2_* environment variables)");
  }
  if (!client) {
    client = new S3Client({
      region: "auto",
      endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY,
      },
    });
  }
  return client;
}

function getBucket(): string {
  if (!env.R2_BUCKET_NAME) {
    throw new Error("R2 storage is not configured (missing R2_BUCKET_NAME)");
  }
  return env.R2_BUCKET_NAME;
}

export async function uploadFile(key: string, buffer: Buffer, mimeType: string | undefined) {
  await getClient().send(
    new PutObjectCommand({
      Bucket: getBucket(),
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    })
  );
}

export async function deleteFile(key: string) {
  await getClient().send(new DeleteObjectCommand({ Bucket: getBucket(), Key: key }));
}

export async function getSignedDownloadUrl(key: string, expiresInSeconds = 3600) {
  const command = new GetObjectCommand({ Bucket: getBucket(), Key: key });
  return getSignedUrl(getClient(), command, { expiresIn: expiresInSeconds });
}

export function isStorageConfigured() {
  return Boolean(env.R2_ACCOUNT_ID && env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY && env.R2_BUCKET_NAME);
}
