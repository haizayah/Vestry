import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { newId, saveUpload } from "@/lib/store";

const ALLOWED = new Set(["audio/mpeg", "audio/mp4", "audio/x-m4a", "audio/wav", "audio/wave", "audio/x-wav"]);
const EXT: Record<string, string> = {
  "audio/mpeg": "mp3",
  "audio/mp4": "m4a",
  "audio/x-m4a": "m4a",
  "audio/wav": "wav",
  "audio/wave": "wav",
  "audio/x-wav": "wav",
};

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await requireRole("director");
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
  }

  const type = file.type || "application/octet-stream";
  const name = file.name.toLowerCase();
  const namedOk = name.endsWith(".mp3") || name.endsWith(".m4a") || name.endsWith(".wav");
  if (!ALLOWED.has(type) && !namedOk) {
    return NextResponse.json({ error: "Upload an mp3, m4a, or wav file." }, { status: 400 });
  }

  const ext =
    EXT[type] ||
    (name.endsWith(".mp3") ? "mp3" : name.endsWith(".m4a") ? "m4a" : "wav");
  const filename = `${newId("audio")}.${ext}`;
  const buffer = new Uint8Array(await file.arrayBuffer());
  await saveUpload(filename, buffer);

  return NextResponse.json({ filename });
}
