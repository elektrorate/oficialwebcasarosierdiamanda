"use client";

import { useEffect, useRef, useState } from "react";
import { assetPath } from "@/lib/assets";
import type { RefObject } from "react";
import type { ShopProductBadge } from "@/data/types";
import { ShopProductBadgeLabel } from "../catalog/ShopProductBadgeLabel";

type Props = {
  productName: string;
  images: string[];
  activeIndex: number;
  activeImage: string;
  badge: ShopProductBadge | null;
  onSelectImage: (index: number) => void;
  onOpenModal: () => void;
  expandButtonRef: RefObject<HTMLButtonElement | null>;
};

export function ShopItemGalleryView({
  productName,
  images,
  activeIndex,
  activeImage,
  badge,
  onSelectImage,
  onOpenModal,
  expandButtonRef,
}: Props) {
  const src = assetPath(activeImage);
  const lastSrc = useRef(src);
  const swapTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [previousSrc, setPreviousSrc] = useState<string | null>(null);

  useEffect(() => {
    if (lastSrc.current === src) return;
    setPreviousSrc(lastSrc.current);
    lastSrc.current = src;

    if (swapTimeout.current) clearTimeout(swapTimeout.current);
    swapTimeout.current = setTimeout(() => {
      setPreviousSrc(null);
      swapTimeout.current = null;
    }, 400);

    return () => {
      if (swapTimeout.current) {
        clearTimeout(swapTimeout.current);
        swapTimeout.current = null;
      }
    };
  }, [src]);

  return (
    <div className="shop-item-gallery" aria-label={`Galería de ${productName}`}>
      <figure className="shop-item-gallery__main">
        <img className="shop-item-gallery__ghost" src={src} alt="" aria-hidden="true" />
        <img className="shop-item-gallery__img" src={src} alt={productName} />
        {previousSrc ? (
          <img
            className="shop-item-gallery__img shop-item-gallery__img--previous"
            src={previousSrc}
            alt=""
            aria-hidden="true"
          />
        ) : null}
        {badge ? <ShopProductBadgeLabel badge={badge} /> : null}
        {images.length > 1 ? (
          <button
            ref={expandButtonRef}
            className="shop-item-gallery__expand"
            type="button"
            aria-label={`Ampliar imagen de ${productName}`}
            onClick={onOpenModal}
          />
        ) : null}
      </figure>

      {images.length > 1 ? (
        <div className="shop-item-gallery__thumbs" role="tablist" aria-label="Miniaturas">
          {images.map((image, index) => {
            const isActive = index === activeIndex;
            return (
              <button
                key={`${image}-${index}`}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-label={`Imagen ${index + 1} de ${productName}`}
                className={`shop-item-gallery__thumb${isActive ? " is-active" : ""}`}
                onClick={() => onSelectImage(index)}
              >
                <img src={assetPath(image)} alt="" loading="lazy" decoding="async" />
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
