import { getPublicShopData } from "@/lib/cms/shop-public";
import { getSettings } from "@/lib/cms/settings";
import { pickRelatedShopItems } from "./lib/pickRelatedShopItems";

export async function loadShopItemPage(slug: string) {
  const settings = await getSettings();
  const config = { siteName: settings.site.site_name, defaultSeoDescription: settings.seo.default_seo_description };
  const { published } = await getPublicShopData(config);
  const item = published.find((entry) => entry.slug === slug) ?? null;
  if (!item) return null;

  return {
    item,
    related: pickRelatedShopItems(published, item, 3),
  };
}
