export function parseYouTubeId(input: string): string | null {
  const value = input.trim();
  if (!value) return null;
  if (/^[a-zA-Z0-9_-]{11}$/.test(value)) return value;

  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0];
      return id && id.length === 11 ? id : null;
    }

    if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com" || host === "youtube-nocookie.com") {
      const v = url.searchParams.get("v");
      if (v && v.length === 11) return v;

      const parts = url.pathname.split("/").filter(Boolean);
      if ((parts[0] === "embed" || parts[0] === "shorts" || parts[0] === "live") && parts[1]?.length === 11) {
        return parts[1];
      }
    }
  } catch {
    return null;
  }

  return null;
}

export function youtubeEmbedUrl(input: string): string | null {
  const id = parseYouTubeId(input);
  return id ? `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1` : null;
}

export function youtubeWatchUrl(input: string): string | null {
  const id = parseYouTubeId(input);
  return id ? `https://www.youtube.com/watch?v=${id}` : null;
}
