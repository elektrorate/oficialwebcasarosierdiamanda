import type { FooterComponent } from "./types";
import type { SiteSettings } from "./settings-types";
import { updateContactSettings } from "./settings";

export type SiteContactSlice = SiteSettings["contact"];

function pickField(footerValue: string | undefined, settingsValue: string | undefined): string {
  const fromFooter = (footerValue ?? "").trim();
  if (fromFooter) return fromFooter;
  return (settingsValue ?? "").trim();
}

/** Valores de contacto del footer en el editor (solo lo que afecta la vista previa). */
export function mergeFooterContactForEditor(
  footer: FooterComponent | null | undefined,
  siteContact: SiteContactSlice,
) {
  return {
    address: pickField(footer?.address, siteContact.address),
    mapUrl: pickField(footer?.map_url, siteContact.map_url),
  };
}

/** Datos visibles en el footer público (una sola resolución). */
export function resolvePublicFooterContact(
  footer: FooterComponent | null | undefined,
  siteContact: SiteContactSlice,
) {
  return {
    mapUrl: pickField(footer?.map_url, siteContact.map_url),
    address: pickField(footer?.address, siteContact.address),
    email: pickField(footer?.contact_email, siteContact.email),
    phone: siteContact.phone?.trim() ?? "",
    whatsapp: pickField(footer?.whatsapp, siteContact.whatsapp),
  };
}

export type FooterSiteContactDisplaySync = {
  address: string;
  mapUrl: string;
};

export function siteContactPatchFromFooterDisplaySync(
  input: FooterSiteContactDisplaySync,
): Partial<SiteContactSlice> {
  return {
    address: input.address.trim(),
    map_url: input.mapUrl.trim(),
  };
}

/** Tras publicar el footer global, copia dirección y mapa a site_settings.contact. */
export async function syncSiteContactDisplayFromFooterEditor(input: FooterSiteContactDisplaySync) {
  // Solo se envía el parche: nunca la porción completa de `contact`, para no
  // sobrescribir cambios globales guardados por otra vía.
  return updateContactSettings(siteContactPatchFromFooterDisplaySync(input));
}

export async function syncSiteContactFromFooterComponent(footer: FooterComponent) {
  return syncSiteContactDisplayFromFooterEditor({
    address: footer.address,
    mapUrl: footer.map_url,
  });
}
