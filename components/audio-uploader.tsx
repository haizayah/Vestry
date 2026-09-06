"use client";

import { useState } from "react";

export function AudioUploader({
  name = "audioFilename",
  initialFilename,
}: {
  name?: string;
  initialFilename?: string | null;
}) {
  const [filename, setFilename] = useState(initialFilename ?? "");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function onFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setStatus("Uploading…");
    const body = new FormData();
    body.set("file", file);
    const res = await fetch("/api/upload", { method: "POST", body });
    const data = (await res.json()) as { filename?: string; error?: string };
    setBusy(false);
    if (!res.ok || !data.filename) {
      setStatus(data.error || "Upload failed.");
      return;
    }
    setFilename(data.filename);
    setStatus(`Ready: ${file.name}`);
  }

  return (
    <div>
      <label className="field-label">Uploaded audio</label>
      <input type="hidden" name={name} value={filename} />
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <label className="btn btn-ghost cursor-pointer">
          {busy ? "Uploading…" : filename ? "Replace audio" : "Upload mp3 / m4a / wav"}
          <input
            type="file"
            accept=".mp3,.m4a,.wav,audio/mpeg,audio/mp4,audio/wav"
            className="sr-only"
            onChange={onFile}
            disabled={busy}
          />
        </label>
        {filename ? (
          <label className="flex items-center gap-2 text-sm text-muted">
            <input type="checkbox" name="clearAudio" className="accent-wine" />
            Remove audio
          </label>
        ) : null}
      </div>
      {status ? <p className="mt-2 text-sm text-muted">{status}</p> : null}
    </div>
  );
}
