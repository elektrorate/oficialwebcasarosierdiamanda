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
        <section className="ig-modal__media">
          <img src={assetPath(images[safeIndex])} alt={title} />
        </section>
      </div>
    </div>,
    document.body,
  );
}
