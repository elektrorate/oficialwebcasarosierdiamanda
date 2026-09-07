import type { Redirect, RedirectType } from "./types";

type PublicRedirect = Pick<Redirect, "id" | "source_url" | "target_url" | "redirect_type">;

export interface ResolvedRedirect {
  url: URL;
  status: 301 | 302 | 308;
}

const STATUS_BY_TYPE: Record<RedirectType, 301 | 302 | 308> = { "301": 301, "302": 302, "308": 308 };

function sortSearchParams(searchParams: URLSearchParams) {
  return new URLSearchParams(
    Array.from(searchParams.entries()).sort(([keyA, valueA], [keyB, valueB]) =>
      keyA === keyB ? valueA.localeCompare(valueB) : keyA.localeCompare(keyB),
    ),
  );
}

function normalizePathname(pathname: string) {
  const withLeadingSlash = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const collapsed = withLeadingSlash.replace(/\/{2,}/g, "/");
  return collapsed.length > 1 ? collapsed.replace(/\/+$/, "") : collapsed;
}

function canonicalInternalUrl(url: URL) {
  const pathname = normalizePathname(url.pathname);
  const search = sortSearchParams(url.searchParams).toString();
  return `${pathname}${search ? `?${search}` : ""}`;
}

export function normalizeRedirectSource(value: string) {
  const source = value.trim();
  if (!source.startsWith("/") || source.startsWith("//")) {
    throw new Error("La URL de origen debe comenzar con / y no puede incluir un dominio.");
  }
  const parsed = new URL(source, "https://redirect.local");
  if (parsed.origin !== "https://redirect.local" || parsed.hash) {
    throw new Error("La URL de origen no puede incluir un dominio ni un fragmento #.");
  }
  return canonicalInternalUrl(parsed);
}

export function normalizeRedirectTarget(value: string) {
  const target = value.trim();
  if (!target) throw new Error("La URL de destino es obligatoria.");

  if (target.startsWith("/")) {
    if (target.startsWith("//")) throw new Error("La URL de destino no puede usar //.");
    const parsed = new URL(target, "https://redirect.local");
    return `${canonicalInternalUrl(parsed)}${parsed.hash}`;
  }

  let parsed: URL;
  try {
    parsed = new URL(target);
  } catch {
    throw new Error("La URL de destino debe comenzar con / o ser una URL https:// completa.");
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error("La URL de destino solo puede usar http:// o https://.");
  }
  return parsed.toString();
}

function sourceMatches(ruleSource: string, candidate: URL) {
  const source = new URL(ruleSource, "https://redirect.local");
  if (normalizePathname(source.pathname) !== normalizePathname(candidate.pathname)) return false;
  if (!source.search) return true;
  return sortSearchParams(source.searchParams).toString() === sortSearchParams(candidate.searchParams).toString();
}

function targetUrl(target: string, current: URL) {
  const next = new URL(target, current.origin);
  for (const [key, value] of current.searchParams) {
    if (!next.searchParams.has(key)) next.searchParams.append(key, value);
  }
  return next;
}

export function resolvePublicRedirect(requestUrl: URL, redirects: PublicRedirect[], maxHops = 10): ResolvedRedirect | null {
  let current = new URL(requestUrl);
  let firstType: RedirectType | null = null;
  const visited = new Set<string>([`${current.origin}${canonicalInternalUrl(current)}`]);

  for (let hop = 0; hop < maxHops; hop += 1) {
    const rule = redirects.find((item) => sourceMatches(item.source_url, current));
    if (!rule) return firstType ? { url: current, status: STATUS_BY_TYPE[firstType] } : null;

    firstType ??= rule.redirect_type;
    const next = targetUrl(rule.target_url, current);
    const key = next.origin === requestUrl.origin ? `${next.origin}${canonicalInternalUrl(next)}` : next.toString();
    if (visited.has(key)) return null;
    visited.add(key);
    current = next;

    if (current.origin !== requestUrl.origin) {
      return { url: current, status: STATUS_BY_TYPE[firstType] };
    }
  }
  return null;
}

export function assertNoActiveRedirectLoop(candidate: Redirect, redirects: Redirect[]) {
  if (candidate.status !== "active") return;
  const active = redirects.filter((item) => item.status === "active" && !item.deleted_at && item.id !== candidate.id);
  if (active.some((item) => normalizeRedirectSource(item.source_url) === candidate.source_url)) {
    throw new Error("Ya existe una redirección activa para esta URL de origen.");
  }
  const result = resolvePublicRedirect(new URL(candidate.source_url, "https://redirect.local"), [candidate, ...active]);
  if (!result) throw new Error("La redirección produciría un bucle. Revisa la URL de destino.");
}
