import { canonicalPublicPath } from "@/lib/cms/public-section-routes";
import type { Metadata } from "next";
import { ShopIndexPage } from "@/features/shop/ShopIndexPage";
import { getSettings } from "@/lib/cms/settings";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return {
    title: settings.seo.default_seo_title || "Shop",
    description:
      settings.seo.default_seo_description ||
      "Piezas ceramicas creadas en el estudio. Objetos unicos, series pequenas y piezas disponibles para compra",
    alternates: { canonical: await canonicalPublicPath("/shop") },
  };
}

export default function ShopPage() {
  return <ShopIndexPage />;
}
