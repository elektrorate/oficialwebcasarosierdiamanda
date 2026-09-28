import { getSettings } from "@/lib/cms/settings";

export async function getShopSettings() {
  const settings = await getSettings();
  return {
    siteName: settings.site.site_name,
    defaultSeoTitle: settings.seo.default_seo_title,
    defaultSeoDescription: settings.seo.default_seo_description,
  };
}
