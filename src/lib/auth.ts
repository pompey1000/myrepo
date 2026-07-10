/**
 * Server-only authentication for ClearScore AI.
 *
 * Two responsibilities:
 *   1. Password hashing — PBKDF2-SHA-512 with a per-user salt. Built on Node's
 *      `crypto` so there are zero extra runtime dependencies. Stored as a
 *      single string: `pbkdf2$<iterations>$<saltHex>$<hashHex>`.
 *   2. Sessions — opaque random tokens held in an HttpOnly cookie, with the
 *      SHA-256 of the token in the `sessions` table. Lets us revoke a
 *      session in one DELETE if a device is lost or compromised.
 *
 * This module is server-only. The cookie helpers here read the request /
 * write a Response, so they belong in route handlers, not in client code.
 */

import { createHash, pbkdf2Sync, randomBytes, timingSafeEqual } from "node:crypto";

import { sql } from "~/db";

// =============================================================================
// Constants
// =============================================================================

const PBKDF2_ITERATIONS = 600_000; // OWASP 2023 recommendation for PBKDF2-SHA512
const PBKDF2_KEYLEN = 64; // bytes
const PBKDF2_DIGEST = "sha512";
const PBKDF2_SALT_BYTES = 16;

export const SESSION_COOKIE = "cs_session";
export const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days
const SESSION_RENEW_THRESHOLD_MS = 1000 * 60 * 60 * 24 * 7; // refresh when < 7 days left

// =============================================================================
// Password hashing
// =============================================================================

/** Hash a password. Returns a self-describing string you store in the DB. */
export const hashPassword = (password: string): string => {
  if (typeof password !== "string" || password.length < 8) {
    throw new Error("Password must be at least 8 characters");
  }
  const salt = randomBytes(PBKDF2_SALT_BYTES);
  const hash = pbkdf2Sync(
    password,
    salt,
    PBKDF2_ITERATIONS,
    PBKDF2_KEYLEN,
    PBKDF2_DIGEST,
  );
  return `pbkdf2$${PBKDF2_ITERATIONS}$${salt.toString("hex")}$${hash.toString("hex")}`;
};

/** Constant-time password verification. Returns true on match. */
export const verifyPassword = (password: string, stored: string): boolean => {
  if (typeof password !== "string" || typeof stored !== "string") return false;
  const parts = stored.split("$");
  if (parts.length !== 4 || parts[0] !== "pbkdf2") return false;
  const iterations = Number(parts[1]);
  const saltHex = parts[2];
  const hashHex = parts[3];
  if (!Number.isFinite(iterations) || iterations < 1_000) return false;
  let salt: Buffer;
  let expected: Buffer;
  try {
    salt = Buffer.from(saltHex, "hex");
    expected = Buffer.from(hashHex, "hex");
  } catch {
    return false;
  }
  if (salt.length === 0 || expected.length === 0) return false;
  const actual = pbkdf2Sync(
    password,
    salt,
    iterations,
    expected.length,
    PBKDF2_DIGEST,
  );
  // timingSafeEqual requires equal-length buffers.
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
};

// =============================================================================
// Sessions
// =============================================================================

export interface SessionRow {
  id: string;
  user_id: string;
  token_hash: string;
  user_agent: string | null;
  ip_address: string | null;
  expires_at: string;
  created_at: string;
  last_seen_at: string;
}

const sha256 = (s: string): string =>
  createHash("sha256").update(s).digest("hex");

/** Mint a new session for `user_id` and return the cookie token (plain, not the hash). */
export const createSession = async (input: {
  user_id: string;
  user_agent?: string | null;
  ip_address?: string | null;
  ttl_ms?: number;
}): Promise<{ token: string; expires_at: Date }> => {
  const token = randomBytes(32).toString("hex"); // 64 chars, 256 bits
  const token_hash = sha256(token);
  const ttl = input.ttl_ms ?? SESSION_TTL_MS;
  const expires_at = new Date(Date.now() + ttl);

  await sql()`
    INSERT INTO sessions (user_id, token_hash, user_agent, ip_address, expires_at)
    VALUES (
      ${input.user_id},
      ${token_hash},
      ${input.user_agent ?? null},
      ${input.ip_address ?? null},
      ${expires_at.toISOString()}::timestamptz
    )
  `;

  return { token, expires_at };
};

/** Look up a session by its plain token. Returns the row (with user binding) or null. */
export const findSession = async (
  token: string,
): Promise<(SessionRow & { user_email: string; user_name: string | null; user_tier: string }) | null> => {
  if (!token || token.length !== 64) return null;
  const token_hash = sha256(token);
  const rows = await sql()`
    SELECT s.*, u.email AS user_email, u.name AS user_name, u.subscription_tier AS user_tier
      FROM sessions s
      JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = ${token_hash}
       AND s.expires_at > now()
     LIMIT 1
  `;
  if (!rows.length) return null;
  const r = rows[0] as Record<string, unknown>;
  return {
    id: String(r.id),
    user_id: String(r.user_id),
    token_hash: String(r.token_hash),
    user_agent: (r.user_agent as string | null) ?? null,
    ip_address: (r.ip_address as string | null) ?? null,
    expires_at: toISO(r.expires_at),
    created_at: toISO(r.created_at),
    last_seen_at: toISO(r.last_seen_at),
    user_email: String(r.user_email),
    user_name: (r.user_name as string | null) ?? null,
    user_tier: String(r.user_tier),
  };
};

/** Delete a single session (logout). */
export const deleteSession = async (token: string): Promise<void> => {
  if (!token) return;
  const token_hash = sha256(token);
  await sql()`DELETE FROM sessions WHERE token_hash = ${token_hash}`;
};

/**
 * Touch a session's `last_seen_at` and extend its expiry if it's close to
 * expiring. Cheap to do on every authenticated request.
 */
export const touchSession = async (input: {
  token: string;
  expires_at: Date;
  ttl_ms?: number;
}): Promise<{ extended: boolean; new_expires_at: Date }> => {
  const ttl = input.ttl_ms ?? SESSION_TTL_MS;
  const now = Date.now();
  const remaining = input.expires_at.getTime() - now;
  if (remaining > SESSION_RENEW_THRESHOLD_MS) {
    return { extended: false, new_expires_at: input.expires_at };
  }
  // Renew.
  const token_hash = sha256(input.token);
  const new_expires_at = new Date(now + ttl);
  await sql()`
    UPDATE sessions
       SET last_seen_at = now(),
           expires_at   = ${new_expires_at.toISOString()}::timestamptz
     WHERE token_hash = ${token_hash}
  `;
  return { extended: true, new_expires_at };
};

// =============================================================================
// Cookie helpers
// =============================================================================

const isProd = () => process.env.NODE_ENV === "production";

/** Build a `Set-Cookie` header value for the session cookie. */
export const buildSessionCookie = (input: {
  token: string;
  expires_at: Date;
  max_age_sec?: number;
}): string => {
  const maxAge = input.max_age_sec ?? Math.floor(SESSION_TTL_MS / 1000);
  // HttpOnly + SameSite=Lax + (in prod) Secure. The Secure flag is omitted in
  // dev so the cookie works over http://localhost.
  const flags = [
    `${SESSION_COOKIE}=${encodeURIComponent(input.token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAge}`,
    `Expires=${input.expires_at.toUTCString()}`,
  ];
  if (isProd()) flags.push("Secure");
  return flags.join("; ");
};

/** Build a `Set-Cookie` header that clears the session cookie. */
export const buildClearSessionCookie = (): string => {
  const flags = [
    `${SESSION_COOKIE}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=0",
    "Expires=Thu, 01 Jan 1970 00:00:00 GMT",
  ];
  if (isProd()) flags.push("Secure");
  return flags.join("; ");
};

/** Read the session token from a `Cookie` header. */
export const readSessionCookie = (cookieHeader: string | null): string | null => {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(/;\s*/)) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    const name = part.slice(0, eq);
    if (name !== SESSION_COOKIE) continue;
    const value = part.slice(eq + 1);
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  }
  return null;
};

// =============================================================================
// Helpers
// =============================================================================

const toISO = (v: unknown): string => {
  if (v == null) return new Date().toISOString();
  if (v instanceof Date) return v.toISOString();
  return String(v);
};

/**
 * Resolved current user from the request cookie, or null if not signed in.
 * Convenience wrapper for the API routes.
 */
export const getCurrentUser = async (request: Request): Promise<{
  user_id: string;
  email: string;
  name: string | null;
  subscription_tier: string;
  token: string;
  session_expires_at: Date;
} | null> => {
  const token = readSessionCookie(request.headers.get("cookie"));
  if (!token) return null;
  const session = await findSession(token);
  if (!session) return null;
  // Sliding expiration — touch but don't await failure.
  const touched = await touchSession({
    token,
    expires_at: new Date(session.expires_at),
  }).catch(() => null);
  return {
    user_id: session.user_id,
    email: session.user_email,
    name: session.user_name,
    subscription_tier: session.user_tier,
    token,
    session_expires_at: touched?.new_expires_at ?? new Date(session.expires_at),
  };
};

// =============================================================================
// Response helpers
// =============================================================================

/** JSON response with the right content-type. */
export const jsonResponse = (body: unknown, init: ResponseInit = {}): Response => {
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(body), { ...init, headers });
};

/** Standard error response. */
export const errorResponse = (
  status: number,
  code: string,
  message: string,
): Response => jsonResponse({ error: { code, message } }, { status });
