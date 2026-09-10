export const SYSTEM_MENU_ROOT_PREFIX = "menu-root:";

export const SYSTEM_MENU_ROOT_KEYS = [
  "inicio",
  "clases",
  "workshops",
  "experiencias",
  "giftcards",
  "estudio",
  "shop",
] as const;

export type SystemMenuRootKey = (typeof SYSTEM_MENU_ROOT_KEYS)[number];

export function systemMenuRootId(key: SystemMenuRootKey) {
  return `${SYSTEM_MENU_ROOT_PREFIX}${key}`;
}

export function systemMenuRootKey(value: unknown): SystemMenuRootKey | null {
  if (typeof value !== "string" || !value.startsWith(SYSTEM_MENU_ROOT_PREFIX)) return null;
  const key = value.slice(SYSTEM_MENU_ROOT_PREFIX.length);
  return (SYSTEM_MENU_ROOT_KEYS as readonly string[]).includes(key)
    ? key as SystemMenuRootKey
    : null;
}

export function normalizeMenuUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const url = value.trim();
  if (!url) return null;

  if (url.startsWith("/") && !url.startsWith("//") && !/[\\\s]/.test(url)) {
    return url;
  }

  try {
    const parsed = new URL(url);
    if (parsed.protocol === "https:" || parsed.protocol === "http:") return url;
  } catch {
    return null;
  }

  return null;
}

export function menuUrlValidationMessage(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return "La URL no puede quedar vacía.";
  if (normalizeMenuUrl(value)) return null;
  return "Usa una ruta interna que empiece por / (por ejemplo, /experiencias) o una URL completa http:// o https://.";
}
