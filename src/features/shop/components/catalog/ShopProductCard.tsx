"use client";

import Link from "next/link";
import { assetPath } from "@/lib/assets";
import type { ShopItem } from "@/data/types";
import { useShopProductCardActions } from "@/features/shop/hooks/useShopProductCardActions";
import { ShopProductBadgeLabel } from "./ShopProductBadgeLabel";
import { ShopProductCardFooter } from "./ShopProductCardFooter";
import { ShopIconEye } from "./ShopProductIcons";
import { applyImageFallback } from "@/lib/image-fallback";

export function ShopProductCard({ item }: { item: ShopItem }) {
  const actions = useShopProductCardActions(item);
  const imageSrc = assetPath(item.image);

  return (
    <article className="shop-product-card">
      <Link
        href={actions.productHref}
        className="shop-product-card__media"
        aria-label={`Ver ${item.name}`}
      >
        <img src={imageSrc} alt={item.name} loading="lazy" decoding="async" onError={applyImageFallback} />
        {item.badge ? <ShopProductBadgeLabel badge={item.badge} /> : null}
        <div className="shop-product-card__hover" aria-hidden="true">
          <span className="shop-product-card__actions">
            <span className="shop-product-card__action">
              <ShopIconEye />
            </span>
          </span>
        </div>
      </Link>
      <ShopProductCardFooter item={item} />
    </article>
  );
}
