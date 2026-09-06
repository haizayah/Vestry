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
const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

export const runtime = "nodejs";

function payloadTooLarge() {
  return NextResponse.json({ error: "File too large. Maximum size is 25 MB." }, { status: 413 });
}

export async function POST(request: Request) {
  try {
    await requireRole("director");
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contentLength = request.headers.get("content-length");
  if (contentLength) {
    const length = Number(contentLength);
    if (Number.isFinite(length) && length > MAX_UPLOAD_BYTES) {
      return payloadTooLarge();
    }
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return payloadTooLarge();
  }

  if (!ALLOWED.has(file.type)) {
    return NextResponse.json({ error: "Upload an mp3, m4a, or wav file." }, { status: 400 });
  }

  const filename = `${newId("audio")}.${EXT[file.type]}`;
  const buffer = new Uint8Array(await file.arrayBuffer());
  if (buffer.byteLength > MAX_UPLOAD_BYTES) {
    return payloadTooLarge();
  }
  await saveUpload(filename, buffer);

  return NextResponse.json({ filename });
}
