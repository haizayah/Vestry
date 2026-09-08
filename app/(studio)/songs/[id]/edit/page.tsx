import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { SongForm } from "@/components/song-form";
import { updateSongAction } from "@/lib/actions";
import { getSession } from "@/lib/auth";
import { requireModule } from "@/lib/guards";
import { readStore } from "@/lib/store";

export const metadata: Metadata = { title: "Edit song" };

export default async function EditSongPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "director") redirect("/songs");
  const { id } = await params;
  const store = await readStore();
  requireModule(store, "worship");
  const song = store.songs.find((s) => s.id === id);
  if (!song) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <p className="field-label">Library</p>
      <h1 className="mb-6 font-serif text-4xl">Edit {song.title}</h1>
      <SongForm song={song} action={updateSongAction} />
    </div>
  );
}
