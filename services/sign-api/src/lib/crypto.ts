import crypto from 'crypto';
import jwt from 'jsonwebtoken';

export const sha256Hex = (buf: Buffer | string) =>
  crypto.createHash('sha256').update(buf).digest('hex');

export const hashToken = (raw: string) => sha256Hex(raw);

export function makeSignerToken(payload: { documentId: string; signerId: string; expSec?: number }) {
  return jwt.sign(
    { d: payload.documentId, s: payload.signerId },
    process.env.JWT_SECRET!,
    { expiresIn: payload.expSec ?? 60 * 60 * 24 }
  );
}

export function verifySignerToken(token: string) {
  return jwt.verify(token, process.env.JWT_SECRET!) as { d: string; s: string; iat: number; exp: number };
}

