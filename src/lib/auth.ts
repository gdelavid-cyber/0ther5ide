import { cookies } from "next/headers";
import { logger } from "@/lib/logger";
import { db, UserProfile } from "@/lib/db/store";

const SESSION_COOKIE_NAME = "godmode_session";
const JWT_SECRET = process.env.JWT_SECRET || "godmode_super_secret_session_key_2026";

// Simple HMAC-SHA256 Token Signature using Web Crypto API
async function signToken(payload: object): Promise<string> {
  const header = { alg: "HS256", typ: "JWT" };
  const b64Header = Buffer.from(JSON.stringify(header)).toString("base64url");
  const b64Payload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const message = `${b64Header}.${b64Payload}`;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(JWT_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  const b64Signature = Buffer.from(signature).toString("base64url");

  return `${message}.${b64Signature}`;
}

async function verifyToken(token: string): Promise<any | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [b64Header, b64Payload, b64Signature] = parts;
    const message = `${b64Header}.${b64Payload}`;

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(JWT_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const signature = Buffer.from(b64Signature, "base64url");
    const isValid = await crypto.subtle.verify("HMAC", key, signature, encoder.encode(message));

    if (!isValid) return null;
    return JSON.parse(Buffer.from(b64Payload, "base64url").toString("utf-8"));
  } catch (err) {
    logger.warn("JWT session verification failed", {}, err);
    return null;
  }
}

export async function getServerSession(): Promise<UserProfile | null> {
  try {
    const cookieStore = cookies();
    const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!sessionToken) return null;
    const payload = await verifyToken(sessionToken);
    if (!payload || !payload.email) return null;

    // Fetch verified profile from database
    return await db.getUser(payload.email);
  } catch (err) {
    logger.error("Error reading server session", {}, err);
    return null;
  }
}

export async function createSessionToken(user: { email: string; name: string }): Promise<string> {
  const payload = {
    email: user.email,
    name: user.name,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 days
  };
  return await signToken(payload);
}
