import { SitePage } from "@/features/shared/layout/SitePage";
import { ShopItemPageHeader } from "./components/ShopItemPageHeader";
import { ShopItemDetailSection } from "./components/item-detail/ShopItemDetailSection";
import type { ShopItem } from "@/data/types";
import { JsonLd } from "@/components/seo/JsonLd";
import { productJsonLd } from "@/lib/seo/structured-data";

export async function ShopItemPage({
  item,
  related,
}: {
  item: ShopItem;
  related: ShopItem[];
}) {
  return (
    <SitePage bodyClass="shop-detail-page" header={<ShopItemPageHeader />}>
      <JsonLd data={productJsonLd(item)} />
      {/* shop-page scopes catalog card styles without applying legacy shop hero rules to the header */}
      <div className="shop-page">
        <ShopItemDetailSection item={item} related={related} />
      </div>
    </SitePage>
  );
}
