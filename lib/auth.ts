import { cookies } from "next/headers";
import { createHmac } from "crypto";
import { readStore } from "./store";
import type { PublicUser, Role, User } from "./types";

const COOKIE = "vestry_session";

function secret() {
  return process.env.SESSION_SECRET || "vestry-dev-secret-change-me";
}

function sign(userId: string) {
  const sig = createHmac("sha256", secret()).update(userId).digest("hex").slice(0, 32);
  return `${userId}.${sig}`;
}

function verify(token: string | undefined): string | null {
  if (!token) return null;
  const [userId, sig] = token.split(".");
  if (!userId || !sig) return null;
  const expected = sign(userId);
  return expected === token ? userId : null;
}

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
}

export async function getSession(): Promise<PublicUser | null> {
  const jar = await cookies();
  const userId = verify(jar.get(COOKIE)?.value);
  if (!userId) return null;
  const store = await readStore();
  const user = store.users.find((u) => u.id === userId);
  return user ? toPublicUser(user) : null;
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

export async function setSessionCookie(userId: string) {
  const jar = await cookies();
  jar.set(COOKIE, sign(userId), {
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
