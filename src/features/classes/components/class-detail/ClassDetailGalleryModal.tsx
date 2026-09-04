"use client";

import { useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { assetPath } from "@/lib/assets";
import type { ClassDetailGalleryItem } from "../../hooks/useClassDetailGallery";

type Props = {
  activeIndex: number;
  items: ClassDetailGalleryItem[];
  offeringTitle: string;
  onClose: () => void;
  onSelect: (index: number) => void;
};

function publicCtaHref(value: string | undefined) {
  const href = value?.trim() ?? "";
  return /^(https?:|mailto:|tel:|\/|#)/i.test(href) ? href : "";
}

export function ClassDetailGalleryModal({
  activeIndex,
  items,
  offeringTitle,
  onClose,
  onSelect,
}: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const imageIndexes = useMemo(
    () => items.flatMap((item, index) => (item.kind === "image" ? [index] : [])),
    [items],
  );
  const activePosition = imageIndexes.indexOf(activeIndex);
  const current = activePosition >= 0 ? items[activeIndex] : null;

  useEffect(() => {
    document.body.classList.add("modal-open");
    panelRef.current?.focus();

    const selectRelative = (direction: -1 | 1) => {
      if (activePosition < 0 || imageIndexes.length < 2) return;
      const nextPosition = (activePosition + direction + imageIndexes.length) % imageIndexes.length;
      onSelect(imageIndexes[nextPosition]);
    };

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
  }, [activePosition, imageIndexes, onClose, onSelect]);

  if (!current || typeof document === "undefined") return null;

  const ctaHref = current.showCta ? publicCtaHref(current.ctaHref) : "";
  const ctaLabel = current.ctaLabel?.trim();
  const hasNavigation = imageIndexes.length > 1;
  const selectRelative = (direction: -1 | 1) => {
    const nextPosition = (activePosition + direction + imageIndexes.length) % imageIndexes.length;
    onSelect(imageIndexes[nextPosition]);
  };

  return createPortal(
    <div
      className="ig-modal offering-gallery-modal is-open"
      role="dialog"
      aria-modal="true"
      aria-labelledby="offering-gallery-modal-title"
    >
      <button
        className="ig-modal__backdrop"
        type="button"
        aria-label="Cerrar galería ampliada"
        onClick={onClose}
      />
      <div className="ig-modal__panel" tabIndex={-1} ref={panelRef}>
        <section className="ig-modal__media">
          <img src={assetPath(current.poster)} alt={current.alt || offeringTitle} />
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
          <h3 id="offering-gallery-modal-title" className="ig-modal__title">
            {offeringTitle}
          </h3>
          {current.modalDescription ? (
            <div className="ig-modal__body">{current.modalDescription}</div>
          ) : null}
          {ctaHref && ctaLabel ? (
            <a
              className="ig-modal__link"
              href={ctaHref}
              target={current.ctaNewTab ? "_blank" : undefined}
              rel={current.ctaNewTab ? "noopener noreferrer" : undefined}
            >
              {ctaLabel}
            </a>
          ) : null}
        </section>
      </div>
    </div>,
    document.body,
  );
}
