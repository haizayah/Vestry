import { promises as fs } from "fs";
import path from "path";
import { createSeed } from "./seed";
import type { StoreData } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_PATH = path.join(DATA_DIR, "store.json");
const UPLOAD_DIR = path.join(DATA_DIR, "uploads");

let writeQueue: Promise<void> = Promise.resolve();

async function ensureDirs() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
}

export function uploadDir() {
  return UPLOAD_DIR;
}

export async function readStore(): Promise<StoreData> {
  await ensureDirs();
  try {
    const raw = await fs.readFile(STORE_PATH, "utf8");
    return JSON.parse(raw) as StoreData;
  } catch {
    const seed = createSeed();
    await fs.writeFile(STORE_PATH, JSON.stringify(seed, null, 2));
    return seed;
  }
}

export async function writeStore(data: StoreData): Promise<void> {
  await ensureDirs();
  await fs.writeFile(STORE_PATH, JSON.stringify(data, null, 2));
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
  return updateStore((store) => {
    const seed = createSeed();
    store.churchName = seed.churchName;
    store.users = seed.users;
    store.people = seed.people;
    store.songs = seed.songs;
    store.plans = seed.plans;
    return seed;
  });
}

export function newId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}
