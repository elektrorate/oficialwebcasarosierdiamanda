import type { SyntheticEvent } from "react";

export const DEFAULT_IMAGE_FALLBACK = "/img/social-2.jpg";

/** Replaces an unavailable CMS image without leaving a broken-image icon. */
export function applyImageFallback(
  event: SyntheticEvent<HTMLImageElement>,
  fallbackSrc = DEFAULT_IMAGE_FALLBACK,
) {
  const image = event.currentTarget;
  if (image.getAttribute("src") === fallbackSrc) return;
  image.onerror = null;
  image.src = fallbackSrc;
}
