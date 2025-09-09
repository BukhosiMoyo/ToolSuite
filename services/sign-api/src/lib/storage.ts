import fs from 'fs/promises';
import path from 'path';
import sanitize from 'sanitize-filename';

const base = process.env.STORAGE_DIR!;

export async function saveFile(bytes: Buffer, filename: string) {
  await fs.mkdir(base, { recursive: true });
  const safe = sanitize(filename);
  const p = path.join(base, `${Date.now()}-${safe}`);
  await fs.writeFile(p, bytes);
  return `file://${p}`;
}

export function presign(url: string) {
  return url; // replace with real presigned URLs in production
}

