"use client";

import { useState } from "react";

export function IcalSubscribe({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-ink-soft">
        Read-only subscribe link for the org calendar — events, plus plans when Worship is on.
      </p>
      <input readOnly value={url} className="field font-mono text-sm" aria-label="iCal feed URL" />
      <div className="flex flex-wrap gap-3">
        <button type="button" className="btn btn-ghost" onClick={copy}>
          {copied ? "Copied" : "Copy subscribe link"}
        </button>
        <a href={url} className="btn btn-ghost">
          Download .ics
        </a>
      </div>
    </div>
  );
}
