import { getFooterContactForm } from "./footer-contact-form";
import { getPublicFooter } from "./footers";
import { buildPublicFooterViewModel, type PublicFooterViewModel } from "./public-footer-model";
import { getSettings } from "./settings";
import type { FooterComponent } from "./types";

export type PublicFooterLayoutData = {
  model: PublicFooterViewModel;
  /** El footer canónico, para que el CMS pueda mostrar sus sobrescrituras. */
  footer: FooterComponent | null;
};

/**
 * Datos del footer global para el layout público.
 *
 * Prioridad de cada valor:
 * - Diseño y contenido del footer: Componentes → Footer (sobrescribe al global).
 * - Contacto, redes y texto legal: Configuración global, salvo que el footer
 *   defina los suyos.
 */
export async function getPublicFooterLayoutData(): Promise<PublicFooterLayoutData> {
  const [footer, contactForm, settings] = await Promise.all([
    getPublicFooter(),
    getFooterContactForm(),
    getSettings(),
  ]);

  return {
    footer,
    model: buildPublicFooterViewModel({
      footer,
      contactForm,
      siteContact: settings.contact,
      siteName: settings.site.site_name,
      // `legal_text` global, nunca `footer_text` (que es texto descriptivo).
      footerLegalText: settings.footer.legal_text,
      footerBrandText: settings.footer.footer_text,
      footerLogoUrl: settings.footer.footer_logo_url,
      siteSocial: settings.social,
      showContactInfo: settings.footer.show_contact_info,
      showSocialLinks: settings.footer.show_social_links,
    }),
  };
}
