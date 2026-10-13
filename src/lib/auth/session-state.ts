/**
 * Estado de sesión transferible entre respuestas, sin dependencias de Next.js
 * para poder testearse en Node puro.
 */

/** Prefijos con sesión: CMS y pantalla de login. */
export const SESSION_REFRESH_PREFIXES = ["/admin", "/auth"] as const;

/** Cabeceras que @supabase/ssr exige propagar junto a las cookies. */
export const SESSION_CACHE_HEADERS = ["cache-control", "expires", "pragma"] as const;

type SessionCookie = { name: string; value: string };

export type RefreshableResponse = {
  cookies: { getAll(): SessionCookie[] };
  headers: Headers;
};

export type SessionTarget = {
  cookies: { set(cookie: SessionCookie): unknown };
  headers: Headers;
};

/** Normaliza una ruta y decide si debe refrescarse la sesión. */
export function shouldRefreshSession(pathname: string): boolean {
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return SESSION_REFRESH_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

/**
 * Copia sobre la respuesta final las cookies renovadas y las cabeceras de caché
 * que entrega Supabase. Sin esto, los `Set-Cookie` se pierden en cualquier
 * respuesta distinta de `NextResponse.next()` (redirects, rewrites, 503).
 */
export function copySessionState<T extends SessionTarget>(target: T, source: RefreshableResponse): T {
  for (const cookie of source.cookies.getAll()) {
    target.cookies.set(cookie);
  }
  for (const header of SESSION_CACHE_HEADERS) {
    const value = source.headers.get(header);
    if (value) target.headers.set(header, value);
  }
  return target;
}
