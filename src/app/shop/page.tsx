import { canonicalPublicPath } from "@/lib/cms/public-section-routes";
import type { Metadata } from "next";
import { ShopIndexPage } from "@/features/shop/ShopIndexPage";

export async function generateMetadata(): Promise<Metadata> { return {
  title: "Shop",
  description:
    "Piezas ceramicas creadas en el estudio. Objetos unicos, series pequenas y piezas disponibles para compra",
  alternates: { canonical: await canonicalPublicPath("/shop") },
}; }

export default function ShopPage() {
  return <ShopIndexPage />;
}
