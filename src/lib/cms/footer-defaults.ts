import type { SocialLink } from "./types";

/** Los datos comerciales deben venir del CMS; vacío es un estado seguro. */
export const DEFAULT_FOOTER_CONTACT_TEXT = "";

export const DEFAULT_FOOTER_THEME = {
  formButtonColor: "#111111",
  formButtonTextColor: "#ffffff",
  socialButtonColor: "#2f2723",
  socialIconColor: "#ffffff",
} as const;

export const DEFAULT_FOOTER_CONTACT_TITLE = "Contacto";

export const DEFAULT_FOOTER_SOCIAL_TITLE = "";

export const DEFAULT_FOOTER_SOCIAL_LINKS: SocialLink[] = [];
