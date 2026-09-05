"use client";

import { useCallback, useMemo, useState } from "react";
import type { ShopItem } from "@/data/types";
import { shopItemGalleryImages } from "../lib/shopItemGalleryImages";

export function useShopItemGallery(item: ShopItem) {
  const images = useMemo(() => shopItemGalleryImages(item), [item]);
  const [activeIndex, setActiveIndex] = useState(0);
  const safeIndex = Math.min(activeIndex, Math.max(images.length - 1, 0));
  const activeImage = images[safeIndex] ?? item.image;

  const selectImage = useCallback((index: number) => {
    setActiveIndex(index);
  }, []);

  const selectRelative = useCallback(
    (direction: -1 | 1) => {
      setActiveIndex((current) => {
        const base = images.length ? Math.min(current, images.length - 1) : 0;
        return (base + direction + images.length) % images.length;
      });
    },
    [images.length],
  );

  const goPrevious = useCallback(() => selectRelative(-1), [selectRelative]);
  const goNext = useCallback(() => selectRelative(1), [selectRelative]);

  return {
    images,
    activeIndex: safeIndex,
    activeImage,
    selectImage,
    selectRelative,
    goPrevious,
    goNext,
  };
}
