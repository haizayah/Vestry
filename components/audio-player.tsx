"use client";

import { useRef, useState } from "react";

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

export function AudioPlayer({
  src,
  title = "Rehearsal audio",
  framed = true,
}: {
  src: string;
  title?: string;
  framed?: boolean;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [activeSrc, setActiveSrc] = useState(src);

  if (src !== activeSrc) {
    setActiveSrc(src);
    setPlaying(false);
    setProgress(0);
    setDuration(0);
  }

  function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      void audio.play();
    } else {
      audio.pause();
    }
  }

  function seek(event: React.ChangeEvent<HTMLInputElement>) {
    const audio = audioRef.current;
    if (!audio) return;
    const next = Number(event.target.value);
    audio.currentTime = next;
    setProgress(next);
  }

  return (
    <div className={framed ? "paper-card rounded-2xl px-4 py-4" : ""}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="field-label mb-1">In-app audio</p>
          <p className="font-serif text-lg leading-tight text-ink">{title}</p>
        </div>
        <button type="button" onClick={toggle} className="btn btn-primary min-w-24">
          {playing ? "Pause" : "Play"}
        </button>
      </div>
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onTimeUpdate={(event) => setProgress(event.currentTarget.currentTime)}
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration || 0)}
      />
      <div className="flex items-center gap-3">
        <span className="w-10 text-xs tabular-nums text-muted">{formatTime(progress)}</span>
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={progress}
          onChange={seek}
          className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-paper-deep accent-wine"
          aria-label="Seek audio"
        />
        <span className="w-10 text-right text-xs tabular-nums text-muted">{formatTime(duration)}</span>
      </div>
    </div>
  );
}
