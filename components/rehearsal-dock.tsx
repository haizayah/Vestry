"use client";

import { AudioPlayer } from "./audio-player";
import { YouTubePlayer } from "./youtube-player";

export function RehearsalDock({
  title,
  youtubeUrl,
  audio,
  onClose,
}: {
  title: string;
  youtubeUrl: string;
  audio: string | null;
  onClose: () => void;
}) {
  return (
    <aside
      className="fixed inset-x-3 bottom-[4.75rem] z-20 max-h-[48vh] overflow-y-auto md:bottom-6 md:left-auto md:right-6 md:w-[min(100%,24rem)]"
      aria-label="Now rehearsing"
    >
      <div className="paper-card rounded-3xl p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="field-label">Now rehearsing</p>
            <p className="font-serif text-xl leading-tight">{title}</p>
          </div>
          <button type="button" className="btn btn-ghost shrink-0 px-3 py-1.5 text-sm" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="mt-3 flex flex-col gap-3">
          {youtubeUrl ? <YouTubePlayer url={youtubeUrl} title={title} /> : null}
          {audio ? <AudioPlayer src={audio} title={`${title} — rehearsal`} framed={false} /> : null}
        </div>
      </div>
    </aside>
  );
}
