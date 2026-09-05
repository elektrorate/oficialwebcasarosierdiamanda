"use client";

import { useCallback, useRef, useState } from "react";
import type { ShopItem } from "@/data/types";
import { useShopItemGallery } from "../../hooks/useShopItemGallery";
import { ShopItemGalleryView } from "./ShopItemGalleryView";
import { ShopItemGalleryModal } from "./ShopItemGalleryModal";

export function ShopItemGallery({ item }: { item: ShopItem }) {
  const gallery = useShopItemGallery(item);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const expandButtonRef = useRef<HTMLButtonElement>(null);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    window.requestAnimationFrame(() => expandButtonRef.current?.focus());
  }, []);

  return (
    <>
      <ShopItemGalleryView
        productName={item.name}
        images={gallery.images}
        activeIndex={gallery.activeIndex}
        activeImage={gallery.activeImage}
        badge={item.badge}
        onSelectImage={gallery.selectImage}
        onOpenModal={() => setIsModalOpen(true)}
        expandButtonRef={expandButtonRef}
      />
      {isModalOpen ? (
        <ShopItemGalleryModal
          title={item.name}
          images={gallery.images}
          activeIndex={gallery.activeIndex}
          onSelect={gallery.selectImage}
          onClose={closeModal}
        />
      ) : null}
    </>
  );
}
