import type { Metadata } from "next";
import { assetPath } from "@/lib/assets";
import { canonicalPublicPath } from "@/lib/cms/public-section-routes";
import { getPublicShopData, getPublicShopItemBySlug } from "@/lib/cms/shop-public";
import { getSettings } from "@/lib/cms/settings";
import { loadShopItemPage } from "./loadShopItemPage";

export async function generateShopStaticParams() {
  const settings = await getSettings();
  const config = { siteName: settings.site.site_name, defaultSeoDescription: settings.seo.default_seo_description };
  const { published } = await getPublicShopData(config);
  return published.map((item) => ({ slug: item.slug }));
}

export async function generateShopItemMetadata(
  params: Promise<{ slug: string }>
): Promise<Metadata> {
  const settings = await getSettings();
  const config = { siteName: settings.site.site_name, defaultSeoDescription: settings.seo.default_seo_description };
  const item = await getPublicShopItemBySlug((await params).slug, config);
  const image = item?.image ? assetPath(item.image) : undefined;
  return item
      ? {
        title: { absolute: item.seoTitle },
        description: item.seoDescription,
        alternates: { canonical: await canonicalPublicPath(`/shop/${item.slug}`) },
        openGraph: {
          type: "website",
          title: item.seoTitle,
          description: item.seoDescription,
          ...(image ? { images: [image] } : {}),
        },
        twitter: {
          card: image ? "summary_large_image" : "summary",
          title: item.seoTitle,
          description: item.seoDescription,
          ...(image ? { images: [image] } : {}),
        },
      }
    : {};
}

export async function getShopRouteItem(params: Promise<{ slug: string }>) {
  const data = await loadShopItemPage((await params).slug);
  return data?.item ?? null;
}
