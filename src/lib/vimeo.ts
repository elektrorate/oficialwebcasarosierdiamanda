/** Accept sharing/player URLs, never an authenticated Vimeo management URL. */
export function vimeoEmbedUrl(raw: string, params: Record<string, string>): string {
  try {
    const source = new URL(raw);
    const host = source.hostname.replace(/^www\./, "");
    if (!["https:", "http:"].includes(source.protocol)) return "";
    const match = host === "player.vimeo.com"
      ? source.pathname.match(/^\/video\/(\d+)\/?$/)
      : host === "vimeo.com" ? source.pathname.match(/^\/(\d+)(?:\/([a-zA-Z0-9]+))?\/?$/) : null;
    if (!match) return "";
    const result = new URL(`https://player.vimeo.com/video/${match[1]}`);
    const hash = source.searchParams.get("h") || match[2];
    if (hash) result.searchParams.set("h", hash);
    for (const [key, value] of Object.entries(params)) result.searchParams.set(key, value);
    return result.toString();
  } catch {
    return "";
  }
}

export function isDirectVideoUrl(raw: string): boolean {
  return /^(?:https?:\/\/|\/)[^\s]*\.(?:mp4|webm|ogg)(?:[?#].*)?$/i.test(raw.trim());
}
