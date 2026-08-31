"use client";

import type { ShopItem } from "@/data/types";
import { ShopProductCard } from "./ShopProductCard";

export function ShopCatalogGrid({ items }: { items: ShopItem[] }) {
  return (
    <div className="shop-catalog__grid grid grid-cols-3 col-gap-[clamp(16px,2vw,28px)] row-gap-[clamp(32px,3.5vw,48px)] min-w-0 max-w-full max-[720px]:grid-cols-2 max-[720px]:col-gap-3 max-[720px]:row-gap-7 max-[480px]:grid-cols-1">
      {items.map((item) => (
        <ShopProductCard key={item.id} item={item} />
      ))}
    </div>
  );
}
