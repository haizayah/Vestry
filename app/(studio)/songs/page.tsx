import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { formatTempo } from "@/lib/format";
import { hasYouTube } from "@/lib/media";
import { hasModule } from "@/lib/modules";
import { readStore } from "@/lib/store";
import { ModuleOffState } from "@/components/module-off-state";

export const metadata: Metadata = { title: "Songs" };

export default async function SongsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const store = await readStore();
  if (!hasModule(store.modules, "worship")) return <ModuleOffState moduleId="worship" />;
  const songs = [...store.songs].sort((a, b) => a.title.localeCompare(b.title));

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="field-label">Library</p>
          <h1 className="font-serif text-4xl tracking-tight md:text-5xl">Songs</h1>
        </div>
        {session.role === "director" ? (
          <Link href="/songs/new" className="btn btn-primary">
            Add song
          </Link>
        ) : null}
      </div>

      <div className="mt-8 overflow-hidden rounded-3xl paper-card">
        <div className="hidden grid-cols-[1.4fr_1fr_80px_90px_1fr] gap-4 border-b border-line px-5 py-3 text-[0.7rem] uppercase tracking-[0.14em] text-muted md:grid">
          <span>Title</span>
          <span>Artist</span>
          <span>Key</span>
          <span>Tempo</span>
          <span>Media</span>
        </div>
        {songs.map((song) => (
          <Link
            key={song.id}
            href={`/songs/${song.id}`}
            className="grid gap-1 border-b border-line/70 px-5 py-4 last:border-0 hover:bg-paper/60 md:grid-cols-[1.4fr_1fr_80px_90px_1fr] md:items-center md:gap-4"
          >
            <span className="font-serif text-xl">{song.title}</span>
            <span className="text-ink-soft">{song.artist || "—"}</span>
            <span className="hidden text-sm text-muted md:block">{song.key || "—"}</span>
            <span className="hidden text-sm text-muted md:block">{formatTempo(song.tempo)}</span>
            <span className="flex flex-wrap gap-2">
              {hasYouTube(song.youtubeUrl) ? <span className="chip">YouTube</span> : null}
              {song.audioFilename ? <span className="chip">Audio</span> : null}
              {!hasYouTube(song.youtubeUrl) && !song.audioFilename ? <span className="text-sm text-muted">None yet</span> : null}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
