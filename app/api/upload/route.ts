import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { newId, saveUpload } from "@/lib/store";

const AUDIO = new Set(["audio/mpeg", "audio/mp4", "audio/x-m4a", "audio/wav", "audio/wave", "audio/x-wav"]);
const IMAGES = new Set(["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"]);
const AUDIO_EXT: Record<string, string> = {
  "audio/mpeg": "mp3",
  "audio/mp4": "m4a",
  "audio/x-m4a": "m4a",
  "audio/wav": "wav",
  "audio/wave": "wav",
  "audio/x-wav": "wav",
};
const IMAGE_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
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
  const kind = String(form.get("kind") || "audio");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return payloadTooLarge();
  }

  const logo = kind === "logo";
  const allowed = logo ? IMAGES : AUDIO;
  const ext = logo ? IMAGE_EXT[file.type] : AUDIO_EXT[file.type];
  if (!allowed.has(file.type) || !ext) {
    return NextResponse.json(
      { error: logo ? "Upload a png, jpg, webp, or gif." : "Upload an mp3, m4a, or wav file." },
      { status: 400 },
    );
  }

  const filename = `${newId(logo ? "logo" : "audio")}.${ext}`;
  const buffer = new Uint8Array(await file.arrayBuffer());
  if (buffer.byteLength > MAX_UPLOAD_BYTES) {
    return payloadTooLarge();
  }
  await saveUpload(filename, buffer);

  const MAX_DATA_URL_BYTES = 80 * 1024;
  const dataUrl =
    logo && buffer.byteLength <= MAX_DATA_URL_BYTES
      ? `data:${file.type};base64,${Buffer.from(buffer).toString("base64")}`
      : undefined;

  return NextResponse.json({ filename, dataUrl });
}
