import { DEFAULT_SETTINGS } from "@/lib/cms/settings-types";

export const EDITORIAL_SCROLL_MENU_FALLBACK = {
  background: "#f9f8f3",
  text: "#3f3933",
  icon: "#3f3933",
  logoTint: "#3f3933",
} as const;

export const FALLBACK_HEADER_LOGO = "/img/logo-header.png";

/**
 * Devuelve el color elegido en Configuración global.
 * Solo se recurre al fallback cuando el valor está vacío: cualquier color
 * válido (incluido blanco) se respeta tal cual, sin sustituciones silenciosas.
 */
export function resolveEditorialScrollColor(
  value: string | undefined,
  fallback: string,
) {
  const trimmed = value?.trim() ?? "";
  return trimmed || fallback;
}

/**
 * Prioridad de logos (de más específica a más general):
 * 1. Logo del menú (`menu.header_logo_url`), campo propio del editor de menú.
 * 2. Logo general del sitio (`site.logo_url`).
 * 3. Recurso estático de respaldo.
 * Los logos de una página concreta (hero, blog, shop) mandan sobre estos
 * porque se resuelven dentro de su propia vista.
 */
export function resolveHeaderLogoUrl(menu: {
  header_logo_url?: string | null;
}, site?: {
  logo_url?: string | null;
}) {
  return (
    menu.header_logo_url?.trim() ||
    site?.logo_url?.trim() ||
    DEFAULT_SETTINGS.menu.header_logo_url ||
    FALLBACK_HEADER_LOGO
  );
}

export function resolveEditorialScrollMenu(
  menu: {
    scroll_menu_background_color?: string;
    scroll_menu_text_color?: string;
    scroll_menu_icon_color?: string;
    scroll_menu_logo_tint_enabled?: boolean;
    scroll_menu_logo_tint_color?: string;
    header_logo_url?: string;
  },
  site?: { logo_url?: string },
) {
  return {
    headerLogoUrl: resolveHeaderLogoUrl(menu, site),
    scrollMenuBackgroundColor: resolveEditorialScrollColor(
      menu.scroll_menu_background_color,
      EDITORIAL_SCROLL_MENU_FALLBACK.background,
    ),
    scrollMenuTextColor: resolveEditorialScrollColor(
      menu.scroll_menu_text_color,
      EDITORIAL_SCROLL_MENU_FALLBACK.text,
    ),
    scrollMenuIconColor: resolveEditorialScrollColor(
      menu.scroll_menu_icon_color,
      menu.scroll_menu_text_color?.trim() || EDITORIAL_SCROLL_MENU_FALLBACK.icon,
    ),
    scrollMenuLogoTintEnabled: Boolean(menu.scroll_menu_logo_tint_enabled),
    scrollMenuLogoTintColor: resolveEditorialScrollColor(
      menu.scroll_menu_logo_tint_color,
      menu.scroll_menu_icon_color?.trim() ||
        menu.scroll_menu_text_color?.trim() ||
        EDITORIAL_SCROLL_MENU_FALLBACK.logoTint,
    ),
  };
}
