"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { ShopItem } from "@/data/types";
import { addCartItem } from "@/lib/cart";
import {
  isShopFavorite,
  SHOP_FAVORITES_STORAGE_KEY,
  toggleShopFavorite,
} from "@/lib/shop-favorites";

function subscribeToShopFavorites(onStoreChange: () => void) {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === SHOP_FAVORITES_STORAGE_KEY) onStoreChange();
  };

  window.addEventListener("casarosier:shop-favorites", onStoreChange);
  window.addEventListener("storage", handleStorage);
  return () => {
    window.removeEventListener("casarosier:shop-favorites", onStoreChange);
    window.removeEventListener("storage", handleStorage);
  };
}

function getServerFavoriteSnapshot() {
  return false;
}

export function useShopProductCardActions(item: ShopItem) {
  const getFavoriteSnapshot = useCallback(() => isShopFavorite(item.id), [item.id]);
  const isFavorite = useSyncExternalStore(
    subscribeToShopFavorites,
    getFavoriteSnapshot,
    getServerFavoriteSnapshot,
  );

  const toggleFavorite = useCallback(
    (event?: { preventDefault: () => void; stopPropagation: () => void }) => {
      event?.preventDefault();
      event?.stopPropagation();
      toggleShopFavorite(item.id);
    },
    [item.id],
  );

  const addToCart = useCallback(
    (event?: { preventDefault: () => void; stopPropagation: () => void }) => {
      event?.preventDefault();
      event?.stopPropagation();
      if (item.badge === "sold") return;
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
    },
    [item],
  );

  return {
    isFavorite,
    toggleFavorite,
    addToCart,
    productHref: `/shop/${item.slug}`,
    isSoldOut: item.badge === "sold",
  };
}
