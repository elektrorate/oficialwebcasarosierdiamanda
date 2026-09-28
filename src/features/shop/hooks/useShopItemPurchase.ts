"use client";

import { useCallback } from "react";
import type { ShopItem } from "@/data/types";
import { addCartItem } from "@/lib/cart";
import { SHOP_LABELS } from "../lib/shopLabels";

export function useShopItemPurchase(item: ShopItem) {
  const isSoldOut = item.badge === "sold";
  const ctaLabel = item.ctaLabel?.trim() || SHOP_LABELS.buyNowAlt;

  const addToCart = useCallback(() => {
    if (isSoldOut) return;
    addCartItem({
      cartItemId: `${item.id}-${Date.now()}`,
      productId: item.id,
      slug: item.slug,
      kind: "product",
      title: item.name,
      subtitle: item.categoryLabel,
      price: item.price,
      quantity: 1,
      addedAt: new Date().toISOString(),
    });
  }, [isSoldOut, item]);

  return {
    ctaLabel,
    isSoldOut,
    addToCart,
  };
}
