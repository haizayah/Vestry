import { cookies } from "next/headers";
import { createHmac } from "crypto";
import type { PublicUser, Role, User } from "./types";

const COOKIE = "vestry_session";

function secret() {
  return process.env.SESSION_SECRET || "vestry-dev-secret-change-me";
}

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
}

function signPayload(user: PublicUser) {
  const body = Buffer.from(JSON.stringify(user), "utf8").toString("base64url");
  const sig = createHmac("sha256", secret()).update(body).digest("hex").slice(0, 32);
  return `${body}.${sig}`;
}

function verifyPayload(token: string | undefined): PublicUser | null {
  if (!token) return null;
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = createHmac("sha256", secret()).update(body).digest("hex").slice(0, 32);
  if (expected !== sig) return null;
  try {
    const user = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as PublicUser;
    if (!user?.id || !user.email || !user.role) return null;
    return user;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<PublicUser | null> {
  const jar = await cookies();
  return verifyPayload(jar.get(COOKIE)?.value);
}

export async function requireSession(): Promise<PublicUser> {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function requireRole(role: Role): Promise<PublicUser> {
  const session = await requireSession();
  if (session.role !== role) {
    throw new Error("Forbidden");
  }
  return session;
}

export async function setSessionCookie(user: PublicUser) {
  const jar = await cookies();
  jar.set(COOKIE, signPayload(user), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    secure: process.env.NODE_ENV === "production",
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export function isDirector(user: PublicUser | null): boolean {
  return user?.role === "director";
}

export const SESSION_COOKIE = COOKIE;
