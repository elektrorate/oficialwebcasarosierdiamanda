import { getSettings } from "@/lib/cms/settings";

/** Un teléfono vacío significa que el CMS aún no ha configurado WhatsApp. */
export const DEFAULT_WHATSAPP_NUMBER = "";

export function normalizeWhatsappNumber(value: string | null | undefined): string {
  if (!value) return "";
  return value.replace(/[^\d]/g, "");
}

export async function getWhatsappNumber(): Promise<string> {
  const settings = await getSettings();
  return normalizeWhatsappNumber(settings.contact.whatsapp);
}

export async function getWhatsappHref(): Promise<string> {
  const number = await getWhatsappNumber();
  return number ? `https://wa.me/${number}` : "";
}
