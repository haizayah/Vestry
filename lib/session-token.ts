import { createHmac, timingSafeEqual } from "crypto";
import type { PublicUser } from "./types";

export const SESSION_COOKIE = "vestry_session";

/** Documented insecure default for local/dev only. Never used when NODE_ENV is production. */
const DEV_SESSION_SECRET = "vestry-dev-secret-change-me";

export function getSessionSecret(): string {
  const value = process.env.SESSION_SECRET?.trim();
  if (value) return value;
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "SESSION_SECRET is required in production. Set it in the environment (Vercel project settings) before deploying.",
    );
  }
  return DEV_SESSION_SECRET;
}

function hmacPrefix(body: string) {
  return createHmac("sha256", getSessionSecret()).update(body).digest("hex").slice(0, 32);
}

function equalHex(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function signSessionToken(user: PublicUser): string {
  const body = Buffer.from(JSON.stringify(user), "utf8").toString("base64url");
  return `${body}.${hmacPrefix(body)}`;
}

export function verifySessionToken(token: string | undefined): PublicUser | null {
  if (!token) return null;
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (!equalHex(hmacPrefix(body), sig)) return null;
  try {
    const user = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as PublicUser;
    if (!user?.id || !user.email || !user.role) return null;
    return user;
  } catch {
    return null;
  }
}
