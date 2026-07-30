import { createHmac } from "node:crypto";
import db from "./db.js";

const JWT_SECRET = process.env.JWT_SECRET || "quicksplit-dev-secret";
const TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function base64url(str) {
  return Buffer.from(str).toString("base64url");
}

function base64urlDecode(str) {
  return Buffer.from(str, "base64url").toString("utf-8");
}

export function signToken(payload) {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + Math.floor(TOKEN_EXPIRY_MS / 1000);

  const tokenPayload = { ...payload, iat: now, exp };

  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payloadEnc = base64url(JSON.stringify(tokenPayload));
  const signature = createHmac("sha256", JWT_SECRET)
    .update(`${header}.${payloadEnc}`)
    .digest("base64url");

  return `${header}.${payloadEnc}.${signature}`;
}

export function verifyToken(token) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [headerEnc, payloadEnc, signature] = parts;

    // Verify signature
    const expectedSig = createHmac("sha256", JWT_SECRET)
      .update(`${headerEnc}.${payloadEnc}`)
      .digest("base64url");

    if (signature !== expectedSig) return null;

    // Decode payload
    const payload = JSON.parse(base64urlDecode(payloadEnc));

    // Check expiry
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid authorization header" });
  }

  const token = authHeader.slice(7);
  const payload = verifyToken(token);

  if (!payload) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  // Look up the user to make sure they still exist
  const user = db
    .query("SELECT id, email, username, account_type, created_at FROM users WHERE id = ?")
    .get(payload.userId);

  if (!user) {
    return res.status(401).json({ error: "User not found" });
  }

  req.user = user;
  next();
}
