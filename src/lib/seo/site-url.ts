const LOCAL_SITE_URL = "http://localhost:3000";

export function getSiteUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (!configuredUrl) {
    if (process.env.NODE_ENV !== "production") return LOCAL_SITE_URL;
    throw new Error("Falta NEXT_PUBLIC_SITE_URL en producción.");
  }

  try {
    return new URL(configuredUrl).origin;
  } catch {
    if (process.env.NODE_ENV !== "production") return LOCAL_SITE_URL;
    throw new Error("NEXT_PUBLIC_SITE_URL debe ser una URL absoluta válida.");
  }
}

export function getAbsoluteSiteUrl(pathname: string) {
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  if (normalizedPath === "/") return getSiteUrl();
  return new URL(normalizedPath, `${getSiteUrl()}/`).toString();
}
