"use client";

import { assetPath } from "@/lib/assets";
import type { ShopItem } from "@/data/types";
import { useShopProductCardActions } from "@/features/shop/hooks/useShopProductCardActions";
import { ShopProductBadgeLabel } from "./ShopProductBadgeLabel";
import { ShopProductCardActions } from "./ShopProductCardActions";
import { ShopProductCardFooter } from "./ShopProductCardFooter";

export function ShopProductCard({ item }: { item: ShopItem }) {
  const actions = useShopProductCardActions(item);
  const imageSrc = assetPath(item.image);

  return (
    <article className="shop-product-card">
      <div className="shop-product-card__media">
        <img src={imageSrc} alt={item.name} loading="lazy" decoding="async" />
        {item.badge ? <ShopProductBadgeLabel badge={item.badge} /> : null}
        <div className="shop-product-card__hover">
          <ShopProductCardActions
            productHref={actions.productHref}
            productName={item.name}
          />
        </div>
      </div>
      <ShopProductCardFooter item={item} />
    </article>
  );
}
