import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AudioPlayer } from "@/components/audio-player";
import { YouTubePlayer } from "@/components/youtube-player";
import { deleteSongAction } from "@/lib/actions";
import { getSession } from "@/lib/auth";
import { formatTempo } from "@/lib/format";
import { audioSrc, hasYouTube } from "@/lib/media";
import { readStore } from "@/lib/store";

export const metadata: Metadata = { title: "Song" };

export default async function SongPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");
  const { id } = await params;
  const store = await readStore();
  const song = store.songs.find((s) => s.id === id);
  if (!song) notFound();
  const usedIn = store.plans.filter((plan) => plan.items.some((item) => item.songId === song.id));
  const audio = audioSrc(song.audioFilename);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="field-label">{song.artist || "Library"}</p>
          <h1 className="font-serif text-4xl tracking-tight md:text-5xl">{song.title}</h1>
          <div className="mt-3 flex flex-wrap gap-2">
            {song.key ? <span className="chip">Key {song.key}</span> : null}
            {song.tempo ? <span className="chip">{formatTempo(song.tempo)}</span> : null}
          </div>
        </div>
        {session.role === "director" ? (
          <div className="flex gap-2">
            <Link href={`/songs/${song.id}/edit`} className="btn btn-ghost">
              Edit
            </Link>
            <form action={deleteSongAction}>
              <input type="hidden" name="id" value={song.id} />
              <button className="btn btn-danger" type="submit">
                Delete
              </button>
            </form>
          </div>
        ) : null}
      </div>

      {song.notes ? (
        <div className="paper-card mb-6 rounded-3xl p-5 text-ink-soft">{song.notes}</div>
      ) : null}

      <div className="flex max-w-3xl flex-col gap-4">
        {hasYouTube(song.youtubeUrl) || audio ? (
          <div className="paper-card flex flex-col gap-4 rounded-3xl p-4">
            {hasYouTube(song.youtubeUrl) ? <YouTubePlayer url={song.youtubeUrl} title={song.title} /> : null}
            {audio ? <AudioPlayer src={audio} title={`${song.title} — uploaded audio`} framed={false} /> : null}
          </div>
        ) : (
          <p className="text-muted">
            No rehearsal media yet.{" "}
            {session.role === "director"
              ? "Edit the song to add YouTube or audio."
              : "Check back after the director uploads."}
          </p>
        )}
      </div>

      {usedIn.length > 0 ? (
        <section className="mt-10">
          <p className="field-label">On these plans</p>
          <ul className="mt-3 space-y-2">
            {usedIn.map((plan) => (
              <li key={plan.id}>
                <Link href={`/plans/${plan.id}`} className="text-wine underline-offset-4 hover:underline">
                  {plan.name} · {plan.date}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
