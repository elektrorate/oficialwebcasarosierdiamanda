import type { ShopItem } from "@/data/types";
import { ShopCatalogGrid } from "../catalog/ShopCatalogGrid";

export function ShopItemRelatedSection({
  items,
  categoryLabel,
}: {
  items: ShopItem[];
  categoryLabel: string;
}) {
  if (!items.length) return null;

  return (
    <section className="shop-item-related section py-[clamp(24px,3vw,40px)] pb-[clamp(64px,6vw,96px)] border-t border-[rgba(58,82,78,0.1)] " aria-labelledby="shop-item-related-title">
      <div className="shop-item-related__container w-[min(100%-40px,1180px)] mx-auto min-[1025px]:px-20">
        <h2 id="shop-item-related-title" className="shop-item-related__title m-0 mb-[clamp(28px,3.5vw,40px)] text-center text-[#3a524e] [font-family:var(--font-display),var(--font-baskervville),serif] text-[clamp(26px,3vw,34px)] italic font-normal leading-[1.2]">
          {categoryLabel.trim()
            ? `Piezas relacionadas · ${categoryLabel}`
            : "Piezas relacionadas"}
        </h2>
        <ShopCatalogGrid items={items} />
      </div>
    </section>
  );
}
