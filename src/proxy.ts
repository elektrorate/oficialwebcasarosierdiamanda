import { getActivePublicRedirects } from "@/lib/cms/public-redirects";
import { resolvePublicRedirect } from "@/lib/cms/redirect-routing";
import { getPublicSectionRoutes } from "@/lib/cms/public-section-routes";
import { canonicalMenuPath, internalMenuPath } from "@/lib/cms/menu-routing";
import {
  MAINTENANCE_RESPONSE_HEADERS,
  MAINTENANCE_STATUS,
  maintenancePageHtml,
  resolveMaintenanceDecision,
} from "@/lib/cms/maintenance";
import { readMaintenanceSnapshot } from "@/lib/cms/maintenance-mode";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

function isPrefetchRequest(request: NextRequest) {
  const purpose = request.headers.get("purpose") || request.headers.get("sec-purpose") || "";
  return request.headers.has("next-router-prefetch") || purpose.toLowerCase().includes("prefetch");
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/admin")) {
    if (isPrefetchRequest(request)) return new NextResponse(null, { status: 204 });
    if (pathname === "/admin") return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    if (pathname === "/admin/login") return NextResponse.redirect(new URL("/auth", request.url));
    return NextResponse.next();
  }

  // Modo mantenimiento: solo páginas públicas, con respuesta 503.
  // `/admin`, `/auth`, `/api` y los recursos estáticos nunca se bloquean, de
  // modo que siempre se puede entrar al CMS y desactivar la bandera.
  // Si la lectura del ajuste falla, `readMaintenanceModeFromSupabase` devuelve
  // `false` y la web sigue disponible (fail-open).
  try {
    const snapshot = await readMaintenanceSnapshot();
    if (resolveMaintenanceDecision({ maintenanceMode: snapshot.maintenanceMode, pathname }) === "block") {
      return new NextResponse(maintenancePageHtml(snapshot.siteName, snapshot.language), {
        status: MAINTENANCE_STATUS,
        headers: MAINTENANCE_RESPONSE_HEADERS,
      });
    }
  } catch {
    // Nunca se interrumpe el sitio por un fallo al leer el ajuste.
  }

  try {
    const [routes, redirects] = await Promise.all([getPublicSectionRoutes(), getActivePublicRedirects()]);
    const internal = internalMenuPath(pathname.replace(/\/$/, "") || "/", routes);
    const internalUrl = request.nextUrl.clone();
    internalUrl.pathname = internal;
    const resolved = resolvePublicRedirect(internalUrl, redirects);
    if (resolved) {
      if (resolved.url.origin === request.nextUrl.origin) resolved.url.pathname = canonicalMenuPath(resolved.url.pathname, routes);
      return NextResponse.redirect(resolved.url, resolved.status);
    }
    const canonical = canonicalMenuPath(internal, routes);
    if (canonical !== pathname && canonical !== pathname.replace(/\/$/, "")) {
      const target = request.nextUrl.clone(); target.pathname = canonical;
      return NextResponse.redirect(target, 301);
    }
    if (internal !== pathname && internal !== pathname.replace(/\/$/, "")) {
      const target = request.nextUrl.clone(); target.pathname = internal;
      return NextResponse.rewrite(target);
    }
  } catch (error) {
    console.error("No se pudo resolver la redirección pública:", error);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|woff|woff2|ttf|pdf)$).*)"],
};
