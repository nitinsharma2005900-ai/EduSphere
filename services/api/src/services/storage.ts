import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

export const storage = new S3Client({
  region: process.env.S3_REGION || 'auto',
  endpoint: process.env.S3_ENDPOINT,
  forcePathStyle: true,
  credentials: { accessKeyId: process.env.S3_ACCESS_KEY || '', secretAccessKey: process.env.S3_SECRET_KEY || '' },
});
export const bucket = process.env.S3_BUCKET_NAME || '';
export async function putObject(key: string, body: Buffer | string, contentType: string) {
  if (!bucket) throw new Error('Object storage is not configured');
  await storage.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: contentType }));
}
export async function getObject(key: string) {
  return storage.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
}
