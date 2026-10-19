/**
 * Server-side security helpers for the JD Mart API:
 *  - requireAuth: verifies the caller's Firebase ID token
 *  - rateLimit:   simple in-memory, per-user request limiter
 *  - escapeHtml / safeUrl: keep user input from injecting HTML or links into emails
 *  - validateUpload: file type and size checks for /api/upload
 *
 * No extra npm packages are needed. Tokens are verified with Google's
 * Identity Toolkit lookup endpoint using the project's (public) Firebase Web API key.
 */
import type { NextFunction, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export interface AuthUser {
  uid: string;
  email: string | null;
  emailVerified: boolean;
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthUser;
  }
}

// ---------------------------------------------------------------------------
// Firebase ID token verification
// ---------------------------------------------------------------------------

function resolveFirebaseApiKey(): string {
  const candidates = [process.env.FIREBASE_API_KEY, process.env.VITE_FIREBASE_API_KEY];
  for (const key of candidates) {
    if (key && key.trim().startsWith('AIza')) return key.trim();
  }
  try {
    const cfgPath = path.resolve(__dirname, '..', 'firebase-applet-config.json');
    const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8')) as { apiKey?: string };
    if (cfg.apiKey) return cfg.apiKey;
  } catch {
    // fall through
  }
  return '';
}

const FIREBASE_API_KEY = resolveFirebaseApiKey();
if (!FIREBASE_API_KEY) {
  console.warn('[security] No Firebase API key found: authenticated API routes will reject all requests.');
}

// Cache verified tokens briefly so we don't call Google on every request.
const TOKEN_CACHE_MS = 5 * 60 * 1000;
const tokenCache = new Map<string, { user: AuthUser; expiresAt: number }>();

async function verifyIdToken(idToken: string): Promise<AuthUser | null> {
  const cached = tokenCache.get(idToken);
  if (cached && cached.expiresAt > Date.now()) return cached.user;
  if (!FIREBASE_API_KEY) return null;

  const resp = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(FIREBASE_API_KEY)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    }
  );
  if (!resp.ok) return null;

  const data = (await resp.json()) as {
    users?: Array<{ localId: string; email?: string; emailVerified?: boolean; disabled?: boolean }>;
  };
  const u = data.users?.[0];
  if (!u || u.disabled) return null;

  const user: AuthUser = { uid: u.localId, email: u.email?.toLowerCase() ?? null, emailVerified: !!u.emailVerified };
  tokenCache.set(idToken, { user, expiresAt: Date.now() + TOKEN_CACHE_MS });
  return user;
}

/** Rejects the request with 401 unless it carries a valid Firebase ID token. */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    return res.status(401).json({ error: 'Sign in required.' });
  }
  try {
    const user = await verifyIdToken(match[1].trim());
    if (!user) return res.status(401).json({ error: 'Your session has expired. Please sign in again.' });
    req.user = user;
    return next();
  } catch (err) {
    console.error('[security] Token verification failed:', err instanceof Error ? err.message : err);
    return res.status(503).json({ error: 'Could not verify your session right now. Please try again.' });
  }
}

// ---------------------------------------------------------------------------
// Rate limiting (in-memory; fine for a single server instance)
// ---------------------------------------------------------------------------

const buckets = new Map<string, { count: number; resetAt: number }>();

/** Allows `max` requests per `windowMs` per signed-in user (or IP if not signed in). */
export function rateLimit(name: string, max: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const who = req.user?.uid || req.ip || 'unknown';
    const key = `${name}:${who}`;
    const now = Date.now();
    const bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }
    if (bucket.count >= max) {
      res.setHeader('Retry-After', Math.ceil((bucket.resetAt - now) / 1000).toString());
      return res.status(429).json({ error: 'Too many requests. Please wait a moment and try again.' });
    }
    bucket.count += 1;
    return next();
  };
}

// Periodically drop expired entries so the maps don't grow forever.
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of buckets) if (v.resetAt <= now) buckets.delete(k);
  for (const [k, v] of tokenCache) if (v.expiresAt <= now) tokenCache.delete(k);
}, 60 * 1000).unref();

// ---------------------------------------------------------------------------
// Email content safety
// ---------------------------------------------------------------------------

/** Escapes a value for safe insertion into email HTML. */
export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Returns the URL only if it is http(s) and, when APP_URL is set, points at the app itself.
 * This stops the email endpoint being used to send links to phishing sites.
 */
export function safeUrl(value: unknown): string | null {
  if (typeof value !== 'string' || !value) return null;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;

  const appUrl = process.env.APP_URL;
  if (appUrl) {
    try {
      if (url.origin !== new URL(appUrl).origin) return null;
    } catch {
      return null;
    }
  }
  return url.toString();
}

export const isValidEmail = (value: unknown): value is string =>
  typeof value === 'string' && value.length <= 254 && /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(value);

// ---------------------------------------------------------------------------
// Upload validation
// ---------------------------------------------------------------------------

export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024; // matches the client-side limit in src/lib/storage.ts

// Only formats the app actually uses. SVG and HTML are deliberately excluded because
// files are served back from our own domain and could run scripts.
const ALLOWED_UPLOADS: Record<string, string[]> = {
  '.jpg': ['image/jpeg'],
  '.jpeg': ['image/jpeg'],
  '.png': ['image/png'],
  '.gif': ['image/gif'],
  '.webp': ['image/webp'],
  '.heic': ['image/heic', 'image/heif'],
  '.heif': ['image/heic', 'image/heif'],
  '.pdf': ['application/pdf'],
  '.doc': ['application/msword'],
  '.docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  '.txt': ['text/plain'],
};

/** Returns an error message, or null if the file is acceptable. */
export function validateUpload(fileName: string, fileType: string | undefined, sizeBytes: number): string | null {
  if (sizeBytes === 0) return 'The file is empty.';
  if (sizeBytes > MAX_UPLOAD_BYTES) return 'File is larger than the 25MB limit.';

  const ext = path.extname(fileName).toLowerCase();
  const allowedMimes = ALLOWED_UPLOADS[ext];
  if (!allowedMimes) return 'This file type is not allowed. Upload an image, PDF, Word or text document.';

  // Some phones send an empty or generic type; only reject a type that clearly contradicts the extension.
  if (fileType && fileType !== 'application/octet-stream' && !allowedMimes.includes(fileType)) {
    return 'The file type does not match its extension.';
  }
  return null;
}
