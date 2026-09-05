"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { assetPath } from "@/lib/assets";

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
  const safeIndex = Math.min(activeIndex, Math.max(images.length - 1, 0));

  const selectRelative = (direction: -1 | 1) => {
    if (images.length < 2) return;
    onSelect((safeIndex + direction + images.length) % images.length);
  };

  useEffect(() => {
    document.body.classList.add("modal-open");
    panelRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft") selectRelative(-1);
      if (event.key === "ArrowRight") selectRelative(1);
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.classList.remove("modal-open");
      document.removeEventListener("keydown", onKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeIndex, images.length, onClose, onSelect]);

  if (!images.length || typeof document === "undefined") return null;

  const hasNavigation = images.length > 1;

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
        <section className="ig-modal__media">
          <img src={assetPath(images[safeIndex])} alt={title} />
        </section>
        <section className="ig-modal__content">
          <div className="ig-modal__topbar">
            <div className="ig-modal__nav-actions" aria-label="Navegación de la galería">
              {hasNavigation ? (
                <>
                  <button
                    className="ig-modal__icon-btn ig-modal__icon-btn--prev"
                    type="button"
                    aria-label="Imagen anterior"
                    onClick={() => selectRelative(-1)}
                  >
                    <span className="ig-modal__arrow-mark ig-modal__arrow-mark--prev" aria-hidden="true" />
                  </button>
                  <button
                    className="ig-modal__icon-btn ig-modal__icon-btn--next"
                    type="button"
                    aria-label="Imagen siguiente"
                    onClick={() => selectRelative(1)}
                  >
                    <span className="ig-modal__arrow-mark ig-modal__arrow-mark--next" aria-hidden="true" />
                  </button>
                </>
              ) : null}
            </div>
            <button
              className="ig-modal__icon-btn ig-modal__icon-btn--close"
              type="button"
              aria-label="Cerrar galería ampliada"
              onClick={onClose}
            >
              <span className="ig-modal__close-mark" aria-hidden="true" />
            </button>
          </div>
          <h3 id="shop-gallery-modal-title" className="ig-modal__title">
            {title}
          </h3>
          <div className="ig-modal__body">
            {safeIndex + 1} de {images.length}
          </div>
        </section>
      </div>
    </div>,
    document.body,
  );
}
