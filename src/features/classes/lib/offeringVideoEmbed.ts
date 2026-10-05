import { vimeoEmbedUrl } from "@/lib/vimeo";

export function isDirectVideoFile(url: string) {
  return /\.(mp4|webm|ogg)(\?|$)/i.test(url.trim());
}

export function offeringVideoEmbedUrl(rawUrl: string, autoplay = false) {
  const trimmed = rawUrl.trim();
  if (!trimmed || isDirectVideoFile(trimmed)) return "";

  try {
    const url = new URL(trimmed);
    const host = url.hostname.replace(/^www\./, "");
    const autoplayParam = autoplay ? "1" : "0";

    if (host === "player.vimeo.com" || host === "vimeo.com") {
      return vimeoEmbedUrl(trimmed, { autoplay: autoplayParam, playsinline: "1" });
    }

    if (host === "youtu.be" || host === "youtube.com" || host === "m.youtube.com") {
      const id =
        host === "youtu.be"
          ? url.pathname.split("/").filter(Boolean)[0]
          : url.searchParams.get("v") || url.pathname.split("/").filter(Boolean).pop();
      return id
        ? `https://www.youtube.com/embed/${id}?autoplay=${autoplayParam}&playsinline=1&modestbranding=1&rel=0`
        : "";
    }
  } catch {
    return "";
  }

  return "";
}

export function offeringVideoIsEmbeddable(rawUrl: string) {
  return Boolean(offeringVideoEmbedUrl(rawUrl, false)) || isDirectVideoFile(rawUrl);
}
