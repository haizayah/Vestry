import { createHmac, timingSafeEqual } from "crypto";
import { gunzipSync, gzipSync } from "zlib";
import { cookies } from "next/headers";
import { getSessionSecret } from "./session-token";
import type { StoreData } from "./types";

export const STORE_COOKIE = "vestry_store";
const CHUNK_PREFIX = "vestry_store_";
const CHUNK_SIZE = 3500;
const MAX_CHUNKS = 16;
const COOKIE_BASE = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 30,
};

function sign(body: string): string {
  return createHmac("sha256", getSessionSecret()).update(body).digest("hex").slice(0, 32);
}

function equalHex(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function encodeStore(data: StoreData): string {
  return gzipSync(Buffer.from(JSON.stringify(data), "utf8")).toString("base64url");
}

function decodeStore(body: string): StoreData {
  const json = gunzipSync(Buffer.from(body, "base64url")).toString("utf8");
  return JSON.parse(json) as StoreData;
}

export async function readStoreCookie(): Promise<StoreData | null> {
  try {
    const jar = await cookies();
    const meta = jar.get(STORE_COOKIE)?.value;
    if (!meta) return null;
    const dot = meta.lastIndexOf(".");
    if (dot <= 0) return null;
    const count = Number(meta.slice(0, dot));
    const sig = meta.slice(dot + 1);
    if (!Number.isInteger(count) || count < 1 || count > MAX_CHUNKS || !sig) return null;

    let body = "";
    for (let i = 0; i < count; i += 1) {
      const part = jar.get(`${CHUNK_PREFIX}${i}`)?.value;
      if (!part) return null;
      body += part;
    }
    if (!equalHex(sign(body), sig)) return null;
    return decodeStore(body);
  } catch {
    return null;
  }
}

export async function writeStoreCookie(data: StoreData): Promise<void> {
  try {
    let payload = data;
    let body = encodeStore(payload);
    if (Math.ceil(body.length / CHUNK_SIZE) > MAX_CHUNKS && payload.logoDataUrl) {
      payload = { ...payload, logoDataUrl: null };
      body = encodeStore(payload);
    }
    const count = Math.ceil(body.length / CHUNK_SIZE);
    if (count < 1 || count > MAX_CHUNKS) return;

    const jar = await cookies();
    const secure = process.env.NODE_ENV === "production";
    jar.set(STORE_COOKIE, `${count}.${sign(body)}`, { ...COOKIE_BASE, secure });
    for (let i = 0; i < count; i += 1) {
      jar.set(`${CHUNK_PREFIX}${i}`, body.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE), {
        ...COOKIE_BASE,
        secure,
      });
    }
    for (let i = count; i < MAX_CHUNKS; i += 1) {
      if (jar.get(`${CHUNK_PREFIX}${i}`)) jar.delete(`${CHUNK_PREFIX}${i}`);
    }
  } catch {
    // RSC/build has no mutable cookie jar.
  }
}

export async function clearStoreCookie(): Promise<void> {
  try {
    const jar = await cookies();
    jar.delete(STORE_COOKIE);
    for (let i = 0; i < MAX_CHUNKS; i += 1) {
      if (jar.get(`${CHUNK_PREFIX}${i}`)) jar.delete(`${CHUNK_PREFIX}${i}`);
    }
  } catch {
    // ignore
  }
}
