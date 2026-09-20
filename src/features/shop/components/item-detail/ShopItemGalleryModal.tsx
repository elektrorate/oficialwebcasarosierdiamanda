"use client";

import { useCallback, useEffect, useRef, type TouchEvent } from "react";
import { createPortal } from "react-dom";
import { assetPath } from "@/lib/assets";
import { applyImageFallback } from "@/lib/image-fallback";

type Props = {
  title: string;
  images: string[];
  activeIndex: number;
  onSelect: (index: number) => void;
  onClose: () => void;
};

export function ShopItemGalleryModal({
  title,
  images,
  activeIndex,
  onSelect,
  onClose,
}: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const safeIndex = Math.min(activeIndex, Math.max(images.length - 1, 0));

  const selectRelative = useCallback((direction: -1 | 1) => {
    if (images.length < 2) return;
    onSelect((safeIndex + direction + images.length) % images.length);
  }, [images.length, onSelect, safeIndex]);

  const onTouchStart = (event: TouchEvent<HTMLElement>) => {
    if (event.touches.length !== 1) return;
    touchStartRef.current = {
      x: event.touches[0].clientX,
      y: event.touches[0].clientY,
    };
  };

  const onTouchEnd = (event: TouchEvent<HTMLElement>) => {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (!start || !event.changedTouches.length) return;

    const deltaX = event.changedTouches[0].clientX - start.x;
    const deltaY = event.changedTouches[0].clientY - start.y;
    if (Math.abs(deltaX) < 50 || Math.abs(deltaX) <= Math.abs(deltaY)) return;
    selectRelative(deltaX > 0 ? -1 : 1);
  };

  useEffect(() => {
    document.body.classList.add("modal-open");
    panelRef.current?.focus();

    return () => document.body.classList.remove("modal-open");
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft") selectRelative(-1);
      if (event.key === "ArrowRight") selectRelative(1);
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose, selectRelative]);

  if (!images.length || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="ig-modal shop-gallery-modal is-open"
      role="dialog"
      aria-modal="true"
      aria-labelledby="shop-gallery-modal-title"
    >
      <button
        className="ig-modal__backdrop"
        type="button"
        aria-label="Cerrar galería ampliada"
        onClick={onClose}
      />
      <div className="ig-modal__panel" tabIndex={-1} ref={panelRef}>
        <h2 id="shop-gallery-modal-title" className="sr-only">
          {title}
        </h2>
        <section
          className="ig-modal__media"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          onTouchCancel={() => { touchStartRef.current = null; }}
        >
          <img src={assetPath(images[safeIndex])} alt={title} onError={applyImageFallback} />
        </section>
      </div>
      {images.length > 1 ? (
        <>
          <button
            className="shop-gallery-modal__nav shop-gallery-modal__nav--prev"
            type="button"
            aria-label="Ver foto anterior"
            onClick={() => selectRelative(-1)}
          >
            <span className="ig-modal__arrow-mark ig-modal__arrow-mark--prev" aria-hidden="true" />
          </button>
          <button
            className="shop-gallery-modal__nav shop-gallery-modal__nav--next"
            type="button"
            aria-label="Ver foto siguiente"
            onClick={() => selectRelative(1)}
          >
            <span className="ig-modal__arrow-mark ig-modal__arrow-mark--next" aria-hidden="true" />
          </button>
        </>
      ) : null}
    </div>,
    document.body,
  );
}
