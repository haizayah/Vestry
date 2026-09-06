import type { Plan, PlanItem, Song } from "./types";
import { parseYouTubeId } from "./youtube";

export function resolveItem(item: PlanItem, songs: Song[]): {
  title: string;
  youtubeUrl: string;
  audioFilename: string | null;
  song: Song | null;
  body?: string;
} {
  const song = item.songId ? songs.find((s) => s.id === item.songId) ?? null : null;
  return {
    title: item.title || song?.title || "Untitled",
    youtubeUrl: item.youtubeUrl || song?.youtubeUrl || "",
    audioFilename: item.audioFilename || song?.audioFilename || null,
    song,
    body: item.body,
  };
}

export function hasYouTube(url: string | undefined | null): boolean {
  return Boolean(url && parseYouTubeId(url));
}

export function mediaReadyCount(plan: Plan, songs: Song[]) {
  const songItems = plan.items.filter((item) => item.type === "song" || item.songId);
  let ready = 0;
  for (const item of songItems) {
    const resolved = resolveItem(item, songs);
    if (hasYouTube(resolved.youtubeUrl) || resolved.audioFilename) ready += 1;
  }
  return { ready, total: songItems.length };
}

export function planHasPlayableMedia(plan: Plan, songs: Song[]) {
  return plan.items.some((item) => {
    const resolved = resolveItem(item, songs);
    return hasYouTube(resolved.youtubeUrl) || Boolean(resolved.audioFilename);
  });
}

export function audioSrc(filename: string | null | undefined): string | null {
  return filename ? `/api/media/${encodeURIComponent(filename)}` : null;
}
