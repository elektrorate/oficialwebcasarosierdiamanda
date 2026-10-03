/**
 * Tipos y valores por defecto de la Configuración global.
 * Módulo puro (sin Supabase) para poder validarlo y testearlo de forma aislada.
 */

export interface SiteSettings {
  site: {
    site_name: string;
    site_description: string;
    logo_url: string;
    favicon_url: string;
    default_language: string;
    timezone: string;
  };
  menu: {
    header_logo_url: string;
    scroll_menu_background_color: string;
    scroll_menu_text_color: string;
    scroll_menu_icon_color: string;
    scroll_menu_logo_tint_enabled: boolean;
    scroll_menu_logo_tint_color: string;
  };
  contact: {
    email: string;
    phone: string;
    whatsapp: string;
    address: string;
    city: string;
    country: string;
    map_url: string;
  };
  social: {
    instagram_url: string;
    tiktok_url: string;
    facebook_url: string;
    youtube_url: string;
    pinterest_url: string;
  };
  footer: {
    footer_logo_url: string;
    footer_text: string;
    legal_text: string;
    show_social_links: boolean;
    show_contact_info: boolean;
  };
  seo: {
    default_seo_title: string;
    default_seo_description: string;
    default_og_image_url: string;
    robots_index: boolean;
    robots_follow: boolean;
  };
  system: {
    maintenance_mode: boolean;
    updated_at: string;
  };
}

export const DEFAULT_SETTINGS: SiteSettings = {
  site: {
    site_name: "Casa Rosier",
    site_description: "",
    logo_url: "",
    favicon_url: "",
    default_language: "es",
    timezone: "Europe/Madrid",
  },
  menu: {
    header_logo_url: "",
    scroll_menu_background_color: "#f9f8f3",
    scroll_menu_text_color: "#3f3933",
    scroll_menu_icon_color: "#3f3933",
    scroll_menu_logo_tint_enabled: false,
    scroll_menu_logo_tint_color: "#3f3933",
  },
  contact: {
    email: "",
    phone: "",
    whatsapp: "",
    address: "",
    city: "Barcelona",
    country: "España",
    map_url: "",
  },
  social: {
    instagram_url: "",
    tiktok_url: "",
    facebook_url: "",
    youtube_url: "",
    pinterest_url: "",
  },
  footer: {
    footer_logo_url: "",
    footer_text: "",
    legal_text: "",
    show_social_links: true,
    show_contact_info: true,
  },
  seo: {
    default_seo_title: "",
    default_seo_description: "",
    default_og_image_url: "",
    robots_index: true,
    robots_follow: true,
  },
  system: {
    maintenance_mode: false,
    updated_at: "",
  },
};

export const SETTINGS_SECTIONS = [
  "site",
  "menu",
  "contact",
  "social",
  "footer",
  "seo",
  "system",
] as const;

export type SettingsSection = (typeof SETTINGS_SECTIONS)[number];
