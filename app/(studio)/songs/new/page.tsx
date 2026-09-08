import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SongForm } from "@/components/song-form";
import { createSongAction } from "@/lib/actions";
import { getSession } from "@/lib/auth";
import { requireModule } from "@/lib/guards";
import { readStore } from "@/lib/store";

export const metadata: Metadata = { title: "New song" };

export default async function NewSongPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "director") redirect("/songs");
  requireModule(await readStore(), "worship");

  return (
    <div className="mx-auto max-w-2xl">
      <p className="field-label">Library</p>
      <h1 className="mb-6 font-serif text-4xl">Add a song</h1>
      <SongForm action={createSongAction} />
    </div>
  );
}
