"use client";

import { useState } from "react";

const MARK_SIZE = 256;

function resizeForMark(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);
    image.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(MARK_SIZE / image.width, MARK_SIZE / image.height, 1);
      const width = Math.max(1, Math.round(image.width * scale));
      const height = Math.max(1, Math.round(image.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not prepare the logo."));
        return;
      }
      ctx.drawImage(image, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) reject(new Error("Could not prepare the logo."));
          else resolve(blob);
        },
        "image/jpeg",
        0.82,
      );
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read that image."));
    };
    image.src = url;
  });
}

export function LogoUploader({
  name = "logoFilename",
  initialFilename,
  initialDataUrl,
}: {
  name?: string;
  initialFilename?: string | null;
  initialDataUrl?: string | null;
}) {
  const [filename, setFilename] = useState(initialFilename ?? "");
  const [dataUrl, setDataUrl] = useState(initialDataUrl ?? "");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function onFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setStatus("Uploading…");
    try {
      const resized = await resizeForMark(file);
      const body = new FormData();
      body.set("file", new File([resized], "logo.jpg", { type: "image/jpeg" }));
      body.set("kind", "logo");
      const res = await fetch("/api/upload", { method: "POST", body });
      const data = (await res.json()) as { filename?: string; dataUrl?: string; error?: string };
      if (!res.ok || !data.filename) {
        setStatus(data.error || "Upload failed.");
        return;
      }
      setFilename(data.filename);
      setDataUrl(data.dataUrl || "");
      setStatus(`Ready: ${file.name}`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <label className="field-label">Org logo</label>
      <input type="hidden" name={name} value={filename} />
      <input type="hidden" name="logoDataUrl" value={dataUrl} />
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        {dataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={dataUrl} alt="" className="h-12 w-12 rounded-xl object-cover ring-1 ring-line" />
        ) : null}
        <label className="btn btn-ghost cursor-pointer">
          {busy ? "Uploading…" : filename ? "Replace logo" : "Upload png / jpg / webp"}
          <input
            type="file"
            accept=".png,.jpg,.jpeg,.webp,.gif,image/png,image/jpeg,image/webp,image/gif"
            className="sr-only"
            onChange={onFile}
            disabled={busy}
          />
        </label>
        {filename ? (
          <label className="flex items-center gap-2 text-sm text-muted">
            <input type="checkbox" name="clearLogo" className="accent-wine" />
            Remove logo
          </label>
        ) : null}
      </div>
      {status ? <p className="mt-2 text-sm text-muted">{status}</p> : null}
      <p className="mt-2 text-sm text-muted">
        Same 25 MB upload limit as rehearsal audio. Vestry shrinks the mark for the sidebar. Accent follows Church (wine)
        or Sports (teal).
      </p>
    </div>
  );
}
