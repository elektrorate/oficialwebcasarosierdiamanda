"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { assetPath } from "@/lib/assets";
import type { RefObject } from "react";
import type { ShopProductBadge } from "@/data/types";
import { ShopProductBadgeLabel } from "../catalog/ShopProductBadgeLabel";
import { applyImageFallback } from "@/lib/image-fallback";

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
      <button
        ref={expandButtonRef}
        type="button"
        className="shop-item-gallery__main"
        aria-label={`Ampliar imagen de ${productName}`}
        onClick={onOpenModal}
      >
        <Image className="shop-item-gallery__ghost" src={src} alt="" width={1000} height={1000} sizes="(max-width: 760px) 100vw, 500px" aria-hidden="true" onError={applyImageFallback} />
        <Image className="shop-item-gallery__img" src={src} alt={productName} width={1000} height={1000} sizes="(max-width: 760px) 100vw, 500px" quality={85} onError={applyImageFallback} />
        {previousSrc ? (
          <Image
            className="shop-item-gallery__img shop-item-gallery__img--previous"
            src={previousSrc}
            alt=""
            width={1000}
            height={1000}
            sizes="(max-width: 760px) 100vw, 500px"
            aria-hidden="true"
            onError={applyImageFallback}
          />
        ) : null}
        {badge ? <ShopProductBadgeLabel badge={badge} /> : null}
      </button>

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
                <Image src={assetPath(image)} alt="" width={160} height={160} sizes="80px" loading="lazy" onError={applyImageFallback} />
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
