import { canonicalPublicPath } from "@/lib/cms/public-section-routes";
import type { Metadata } from "next";
import { ShopIndexPage } from "@/features/shop/ShopIndexPage";
import { assetPath } from "@/lib/assets";
import { getShopPageSettings } from "@/lib/cms/shop-page";
import { getSettings } from "@/lib/cms/settings";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const page = await getShopPageSettings(
    settings.site.site_name,
    settings.seo.default_seo_title,
    settings.seo.default_seo_description,
  );
  const title = page.seo_title || settings.seo.default_seo_title || "Shop";
  const description =
    page.seo_description ||
    settings.seo.default_seo_description ||
    "Piezas ceramicas creadas en el estudio. Objetos unicos, series pequenas y piezas disponibles para compra";
  const image = page.seo_image
    ? assetPath(page.seo_image)
    : settings.seo.default_og_image_url
      ? assetPath(settings.seo.default_og_image_url)
      : undefined;

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: await canonicalPublicPath("/shop") },
    openGraph: {
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}

export default function ShopPage() {
  return <ShopIndexPage />;
}
