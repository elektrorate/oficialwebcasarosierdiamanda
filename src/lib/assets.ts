const missingAssetFallbacks: Record<string, string> = {
  "img/clase-1.png": "/img/social-2.jpg",
  "img/clase-2.png": "/img/intro-e.jpg",
  "img/clase-3.png": "/img/social-3.jpg",
  "img/c0c8f2c3-1d13-4632-9fe8-1ad322e51abd.png": "/img/intro-e.jpg",
  "img/0429e735-6642-4339-8e1b-72bdade5c8ad.png": "/img/workshop-3.jpg",
  "img/5fd27c84-15dd-43ef-b039-2e8458a3f1a6.png": "/img/social-5.png"
};

export function assetPath(value: string): string {
  if (!value) return value;
  if (/^(data:|blob:|\/)/i.test(value)) return value;
  if (/^https?:/i.test(value)) return value;
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
