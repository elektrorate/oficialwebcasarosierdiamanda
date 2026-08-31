import type { ShopItem } from "@/data/types";
import { ShopItemGallery } from "./ShopItemGallery";
import { ShopItemPurchasePanel } from "./ShopItemPurchasePanel";
import { ShopItemRelatedSection } from "./ShopItemRelatedSection";

export function ShopItemDetailSection({
  item,
  related,
}: {
  item: ShopItem;
  related: ShopItem[];
}) {
  return (
    <>
      <section className="shop-item-detail section py-[clamp(32px,4vw,56px)] pb-[clamp(48px,5vw,72px)] min-[1025px]:pt-5!">
        <div className="shop-item-detail__container w-[min(100%-40px,1180px)] mx-auto min-[1025px]:px-20">
          <div className="shop-item-detail__layout grid grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] gap-[clamp(28px,4vw,56px)] items-start max-[900px]:grid-cols-1">
            <ShopItemGallery item={item} />
            <ShopItemPurchasePanel item={item} />
          </div>
        </div>
      </section>
      <ShopItemRelatedSection items={related} categoryLabel={item.categoryLabel} />
    </>
  );
}
