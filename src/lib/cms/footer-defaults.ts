import type { SocialLink } from "./types";

export const DEFAULT_FOOTER_CONTACT_TEXT =
  "+34 600 000 000\nBarcelona, Espana\nLunes a Sabado - 10:00 a 20:00\nSiguenos en Nuestras Redes:";

export const DEFAULT_FOOTER_THEME = {
  formButtonColor: "#111111",
  formButtonTextColor: "#ffffff",
  socialButtonColor: "#2f2723",
  socialIconColor: "#ffffff",
} as const;

export const DEFAULT_FOOTER_CONTACT_TITLE = "Contacto";

export const DEFAULT_FOOTER_SOCIAL_TITLE = "Siguenos en Nuestras Redes:";

export const DEFAULT_FOOTER_SOCIAL_LINKS: SocialLink[] = [
  {
    platform: "instagram",
    url: "https://www.instagram.com/casarosier",
    label: "Instagram",
    icon_url: "/img/icon-instagram.svg",
    icon_color: "#ffffff",
    button_color: "#2f2723",
  },
  {
    platform: "facebook",
    url: "https://www.facebook.com/casarosier",
    label: "Facebook",
    icon_url: "/img/icon-facebook.svg",
    icon_color: "#ffffff",
    button_color: "#2f2723",
  },
];
