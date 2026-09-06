import { cookies } from "next/headers";
import type { PublicUser, Role, User } from "./types";
import { SESSION_COOKIE, signSessionToken, verifySessionToken } from "./session-token";

export { SESSION_COOKIE, verifySessionToken } from "./session-token";

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
  return verifySessionToken(jar.get(SESSION_COOKIE)?.value);
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
  jar.set(SESSION_COOKIE, signSessionToken(user), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    secure: process.env.NODE_ENV === "production",
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

export function isDirector(user: PublicUser | null): boolean {
  return user?.role === "director";
}
