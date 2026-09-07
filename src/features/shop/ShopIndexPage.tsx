import { ShopCatalogSection } from "@/features/shop/components/catalog/ShopCatalogSection";
import { SitePage } from "@/features/shared/layout/SitePage";
import PublicFaqSection from "@/features/shared/contextual-sections/PublicFaqSection";
import { ShopIndexHeader } from "./components/ShopIndexHeader";
import { loadShopIndexPage } from "./loadShopIndexPage";

export async function ShopIndexPage() {
  const { published, shopCategories, hero, faqSection } = await loadShopIndexPage();

  return (
    <SitePage bodyClass="shop-page" header={<ShopIndexHeader hero={hero} />}>
      <h1 className="sr-only">Shop de cerámica artesanal de Casa Rosier</h1>
      <ShopCatalogSection published={published} shopCategories={shopCategories} />
      <PublicFaqSection pageSection={faqSection} eyebrow="" />
    </SitePage>
  );
}
