"use client";

import { createContext, useContext, type ReactNode } from "react";
import { DEFAULT_SITE_TIME_ZONE, resolveSiteTimeZone } from "@/lib/seo/site-timezone";

const SiteTimeZoneContext = createContext<string>(DEFAULT_SITE_TIME_ZONE);

/**
 * Propaga la zona horaria global (Configuración global → Sitio → Zona horaria)
 * a los componentes de cliente, para que formateen fechas con el mismo valor que
 * el servidor y no se produzcan diferencias de hidratación.
 */
export function SiteTimeZoneProvider({
  timeZone,
  children,
}: {
  timeZone: string;
  children: ReactNode;
}) {
  return (
    <SiteTimeZoneContext.Provider value={resolveSiteTimeZone(timeZone)}>
      {children}
    </SiteTimeZoneContext.Provider>
  );
}

export function useSiteTimeZone() {
  return useContext(SiteTimeZoneContext);
}
