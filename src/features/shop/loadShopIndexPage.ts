import { getShopPageSettings } from "@/lib/cms/shop-page";
import { getPublicPageFaqSectionBySlug } from "@/lib/cms/page-faqs";
import { getPublicShopData } from "@/lib/cms/shop-public";
import { getShopSettings } from "./lib/getShopSettings";

export async function loadShopIndexPage() {
  const [siteConfig, page, faqSection] = await Promise.all([
    getShopSettings(),
    getShopPageSettings(),
    getPublicPageFaqSectionBySlug("shop"),
  ]);
  const config = { siteName: siteConfig.siteName, defaultSeoDescription: siteConfig.defaultSeoDescription };
  const shopData = await getPublicShopData(config);

  return {
    published: shopData.published,
    shopCategories: shopData.shopCategories,
    hero: page.hero,
    faqSection,
    siteName: siteConfig.siteName,
    defaultSeoTitle: siteConfig.defaultSeoTitle,
    defaultSeoDescription: siteConfig.defaultSeoDescription,
  };
}
