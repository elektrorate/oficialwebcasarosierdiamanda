"use client";

import { MarkdownContent } from "@/components/ui/MarkdownContent";
import type { ShopItem } from "@/data/types";
import { useShopItemPurchase } from "../../hooks/useShopItemPurchase";
import { SHOP_LABELS } from "../../lib/shopLabels";
import { ShopItemPrice } from "./ShopItemPrice";

export function ShopItemPurchasePanel({ item }: { item: ShopItem }) {
  const { addToCart } = useShopItemPurchase(item);
  const subtitle = item.availabilityNote?.trim() || item.categoryLabel;

  return (
    <div className="shop-item-purchase">
      <header className="shop-item-purchase__head">
        <h1 className="shop-item-purchase__title">{item.name}</h1>
        {subtitle ? <p className="shop-item-purchase__subtitle">{subtitle}</p> : null}
        <ShopItemPrice item={item} />
      </header>

      {item.description.trim() ? (
        <MarkdownContent
          className="shop-item-purchase__description"
          source={item.description}
        />
      ) : null}

      <div className="shop-item-purchase__cta">
        {item.badge === "sold" ? (
          <button
            type="button"
            className="shop-item-purchase__button"
            disabled
          >
            {SHOP_LABELS.soldOut}
          </button>
        ) : item.ctaUrl.trim() ? (
          <a
            className="shop-item-purchase__button"
            href={item.ctaUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            {item.ctaLabel?.trim() || SHOP_LABELS.buyNowAlt}
          </a>
        ) : (
          <button
            type="button"
            className="shop-item-purchase__button"
            onClick={addToCart}
          >
            {item.ctaLabel?.trim() || SHOP_LABELS.buyNowAlt}
          </button>
        )}
      </div>
    </div>
  );
}
