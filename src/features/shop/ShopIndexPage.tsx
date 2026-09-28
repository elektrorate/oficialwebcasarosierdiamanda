import { ShopCatalogSection } from "@/features/shop/components/catalog/ShopCatalogSection";
import { SitePage } from "@/features/shared/layout/SitePage";
import PublicFaqSection from "@/features/shared/contextual-sections/PublicFaqSection";
import { ShopIndexHeader } from "./components/ShopIndexHeader";
import { loadShopIndexPage } from "./loadShopIndexPage";

export async function ShopIndexPage() {
  const { published, shopCategories, hero, faqSection, siteName } = await loadShopIndexPage();

  return (
    <SitePage bodyClass="shop-page" header={<ShopIndexHeader hero={hero} siteName={siteName} />}>
      <h1 className="sr-only">Shop de cerámica artesanal de {siteName}</h1>
      <ShopCatalogSection published={published} shopCategories={shopCategories} />
      <PublicFaqSection pageSection={faqSection} eyebrow="" />
    </SitePage>
  );
}
