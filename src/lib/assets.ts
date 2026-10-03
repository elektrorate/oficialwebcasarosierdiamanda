const missingAssetFallbacks: Record<string, string> = {
  "img/clase-1.png": "/img/social-2.jpg",
  "img/clase-2.png": "/img/intro-e.jpg",
  "img/clase-3.png": "/img/social-3.jpg",
  "img/c0c8f2c3-1d13-4632-9fe8-1ad322e51abd.png": "/img/intro-e.jpg",
  "img/0429e735-6642-4339-8e1b-72bdade5c8ad.png": "/img/workshop-3.jpg",
  "img/5fd27c84-15dd-43ef-b039-2e8458a3f1a6.png": "/img/social-5.png"
};

// No usar un proyecto real como respaldo: un entorno mal configurado no debe
// cargar silenciosamente sus medios desde producción.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const STORAGE_MEDIA_ORIGIN = SUPABASE_URL
  ? `${SUPABASE_URL}/storage/v1/object/public/media`
  : "";
const STORAGE_IMAGE_EXT = /\.(avif|jpe?g|png|webp)$/i;

export function assetPath(
  value: string,
  options?: { width?: number; quality?: number }
): string {
  if (!value) return value;
  if (/^(data:|blob:|\/)/.test(value)) return value;
  if (/^https?:/.test(value)) {
    if (
      STORAGE_MEDIA_ORIGIN &&
      value.startsWith(STORAGE_MEDIA_ORIGIN) &&
      STORAGE_IMAGE_EXT.test(value.split("?")[0])
    ) {
      const [base, search = ""] = value.split("?");
      const params = new URLSearchParams(search);
      if (!params.has("width")) params.set("width", String(options?.width ?? 1200));
      if (!params.has("quality")) params.set("quality", String(options?.quality ?? 75));
      return `${base}?${params.toString()}`;
    }
    return value;
  }
  return missingAssetFallbacks[value] ?? `/${value.replace(/^\.?\//, "")}`;
}

export function internalHref(value: string): string {
  if (!value) return value;
  if (/^(https?:|mailto:|tel:|#|\/)/.test(value)) return value;

  const normalized = value
    .replace(/^\.\//, "")
    .replace(/index\.html$/, "")
    .replace(/\.html$/, "")
    .replace(/\/$/, "");

  return normalized ? `/${normalized}` : "/";
}
