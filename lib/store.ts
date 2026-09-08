import { promises as fs } from "fs";
import path from "path";
import { normalizeModules } from "./modules";
import { createSeed } from "./seed";
import { clearStoreCookie, readStoreCookie, writeStoreCookie } from "./store-cookie";
import type { StoreData } from "./types";

function serverless() {
  return process.env.VERCEL === "1" || process.env.VERCEL === "true";
}

function building() {
  return process.env.NEXT_PHASE === "phase-production-build";
}

let memory: StoreData | null = null;
let writeQueue: Promise<void> = Promise.resolve();

function seedClone(): StoreData {
  return structuredClone(createSeed());
}

function normalizeStore(data: StoreData): StoreData {
  if (!Array.isArray(data.lockouts)) {
    data.lockouts = [];
  }
  if (!Array.isArray(data.events)) {
    data.events = [];
  }
  if (!Array.isArray(data.messages)) {
    data.messages = [];
  }
  if (!Array.isArray(data.activity)) {
    data.activity = [];
  }
  if (!Array.isArray(data.resources)) {
    data.resources = [];
  }
  if (!Array.isArray(data.bookings)) {
    data.bookings = [];
  }
  if (!data.orgType) {
    data.orgType = "church";
  }
  if (data.logoFilename === undefined) {
    data.logoFilename = null;
  }
  if (data.logoDataUrl === undefined) {
    data.logoDataUrl = null;
  }
  if (!data.icalToken) {
    data.icalToken = "harbor-demo-ical";
  }
  data.modules = normalizeModules(data.modules);
  return data;
}

async function persist(data: StoreData) {
  if (building()) return;
  const json = JSON.stringify(data, null, 2);
  try {
    if (serverless()) {
      await fs.writeFile(path.join("/tmp", "vestry-store.json"), json);
      return;
    }
    await fs.mkdir(path.join(process.cwd(), "data"), { recursive: true });
    await fs.writeFile(path.join(process.cwd(), "data", "store.json"), json);
  } catch {
    // Preview/serverless filesystems are often read-only outside /tmp.
  }
}

async function readPersisted(): Promise<StoreData | null> {
  if (building()) return null;
  try {
    if (serverless()) {
      const raw = await fs.readFile(path.join("/tmp", "vestry-store.json"), "utf8");
      return normalizeStore(JSON.parse(raw) as StoreData);
    }
    const raw = await fs.readFile(path.join(process.cwd(), "data", "store.json"), "utf8");
    return normalizeStore(JSON.parse(raw) as StoreData);
  } catch {
    return null;
  }
}

export async function readStore(): Promise<StoreData> {
  if (building()) {
    if (!memory) memory = seedClone();
    return memory;
  }

  if (serverless()) {
    const cookie = await readStoreCookie();
    if (cookie) {
      memory = normalizeStore(cookie);
      return memory;
    }
    const persisted = await readPersisted();
    if (persisted) {
      memory = persisted;
      return memory;
    }
    if (!memory) memory = seedClone();
    return memory;
  }

  const persisted = await readPersisted();
  if (persisted) return persisted;

  const seed = seedClone();
  await persist(seed);
  return seed;
}

export async function writeStore(data: StoreData): Promise<void> {
  memory = data;
  await persist(data);
  if (serverless()) {
    await writeStoreCookie(data);
  }
}

export async function updateStore<T>(fn: (store: StoreData) => T | Promise<T>): Promise<T> {
  let result!: T;
  const run = writeQueue.then(async () => {
    const store = await readStore();
    result = await fn(store);
    await writeStore(store);
  });
  writeQueue = run.then(
    () => undefined,
    () => undefined,
  );
  await run;
  return result;
}

export async function resetStore(): Promise<StoreData> {
  const seed = seedClone();
  memory = seed;
  await persist(seed);
  if (serverless()) {
    await clearStoreCookie();
    await writeStoreCookie(seed);
  }
  return seed;
}

export function newId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}

export async function saveUpload(filename: string, buffer: Uint8Array): Promise<void> {
  const safe = path.basename(filename);
  if (serverless()) {
    await fs.mkdir(path.join("/tmp", "vestry-uploads"), { recursive: true });
    await fs.writeFile(path.join("/tmp", "vestry-uploads", safe), buffer);
    return;
  }
  await fs.mkdir(path.join(process.cwd(), "data", "uploads"), { recursive: true });
  await fs.writeFile(path.join(process.cwd(), "data", "uploads", safe), buffer);
}

export async function readUpload(filename: string): Promise<Uint8Array | null> {
  const safe = path.basename(filename);
  try {
    return await fs.readFile(path.join("/tmp", "vestry-uploads", safe));
  } catch {
    // fall through to the committed seed folder
  }
  try {
    return await fs.readFile(path.join(process.cwd(), "data", "uploads", safe));
  } catch {
    return null;
  }
}
