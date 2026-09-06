import { youtubeEmbedUrl } from "@/lib/youtube";

export function YouTubePlayer({
  url,
  title = "YouTube rehearsal",
}: {
  url: string;
  title?: string;
}) {
  const embed = youtubeEmbedUrl(url);
  if (!embed) return null;

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-sage-deep shadow-[0_24px_50px_-32px_rgba(28,25,20,0.55)]">
      <div className="relative aspect-video">
        <iframe
          src={embed}
          title={title}
          className="absolute inset-0 h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    </div>
  );
}
