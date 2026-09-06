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
      className="rehearsal-dock"
      aria-label="Now rehearsing"
    >
      <div className="paper-card rehearsal-dock-card rounded-3xl p-4">
        <div className="flex shrink-0 items-start justify-between gap-3">
          <div>
            <p className="field-label">Now rehearsing</p>
            <p className="font-serif text-xl leading-tight">{title}</p>
          </div>
          <button type="button" className="btn btn-ghost shrink-0 px-3 py-1.5 text-sm" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="rehearsal-dock-body mt-3 flex flex-col gap-3">
          {youtubeUrl ? <YouTubePlayer url={youtubeUrl} title={title} /> : null}
          {audio ? <AudioPlayer src={audio} title={`${title} — rehearsal`} framed={false} /> : null}
        </div>
      </div>
    </aside>
  );
}
