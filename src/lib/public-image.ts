import { getImageProps, type ImageProps } from "next/image";
import { assetPath } from "./assets";
import { imageRemotePatterns } from "./image-config";

export function getPublicImageProps({ src, ...options }: Omit<ImageProps, "src"> & { src: string }) {
  const resolved = assetPath(src);
  let optimizable = /^\/(?!\/)/.test(resolved);
  if (/^https?:/i.test(resolved)) {
    try {
      const url = new URL(resolved);
      optimizable = imageRemotePatterns.some((pattern) =>
        url.protocol === `${pattern.protocol}:` && url.hostname === pattern.hostname &&
        url.port === pattern.port && url.pathname.startsWith(pattern.pathname.slice(0, -2)),
      );
    } catch {
      optimizable = false;
    }
  }
  // Preserve existing external embeds without allowing arbitrary optimizer origins.
  const svg = /\.svg$/i.test(resolved.split(/[?#]/, 1)[0]);
  return getImageProps({ ...options, src: resolved, unoptimized: options.unoptimized || !optimizable || svg }).props;
}
