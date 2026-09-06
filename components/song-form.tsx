import { AudioUploader } from "./audio-uploader";
import type { Song } from "@/lib/types";

export function SongForm({
  song,
  action,
}: {
  song?: Song;
  action: (formData: FormData) => Promise<void>;
}) {
  return (
    <form action={action} className="paper-card space-y-5 rounded-3xl p-6 md:p-8">
      {song ? <input type="hidden" name="id" value={song.id} /> : null}
      <div className="grid gap-5 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="field-label" htmlFor="title">
            Title
          </label>
          <input id="title" name="title" required defaultValue={song?.title} className="field" />
        </div>
        <div>
          <label className="field-label" htmlFor="artist">
            Artist
          </label>
          <input id="artist" name="artist" defaultValue={song?.artist} className="field" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="field-label" htmlFor="key">
              Key
            </label>
            <input id="key" name="key" defaultValue={song?.key} placeholder="G" className="field" />
          </div>
          <div>
            <label className="field-label" htmlFor="tempo">
              Tempo
            </label>
            <input
              id="tempo"
              name="tempo"
              type="number"
              min={40}
              max={220}
              defaultValue={song?.tempo ?? ""}
              placeholder="72"
              className="field"
            />
          </div>
        </div>
        <div className="md:col-span-2">
          <label className="field-label" htmlFor="youtubeUrl">
            YouTube URL
          </label>
          <input
            id="youtubeUrl"
            name="youtubeUrl"
            defaultValue={song?.youtubeUrl}
            placeholder="https://www.youtube.com/watch?v=…"
            className="field"
          />
        </div>
        <div className="md:col-span-2">
          <AudioUploader initialFilename={song?.audioFilename} />
        </div>
        <div className="md:col-span-2">
          <label className="field-label" htmlFor="notes">
            Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={4}
            defaultValue={song?.notes}
            className="field min-h-28"
            placeholder="Arrangement notes, capo, who leads…"
          />
        </div>
      </div>
      <div className="flex justify-end">
        <button type="submit" className="btn btn-primary">
          {song ? "Save song" : "Add to library"}
        </button>
      </div>
    </form>
  );
}
