import { memo, type RefObject } from "react";
import Image from "next/image";
import type { TestimonialSlide } from "../types";

function TestimonialDetailModalComponent({
  slide,
  panelRef,
  onClose,
  onPrevious,
  onNext,
}: {
  slide: TestimonialSlide;
  panelRef: RefObject<HTMLDivElement | null>;
  onClose: () => void;
  onPrevious: () => void;
  onNext: () => void;
}) {
  return (
    <div
      className="testimonial-modal is-open"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tm-title"
    >
      <button
        className="testimonial-modal__backdrop"
        type="button"
        aria-label="Cerrar"
        onClick={onClose}
      />
      <div className="testimonial-modal__panel" tabIndex={-1} ref={panelRef}>
        <div className="testimonial-modal__topbar">
          <button
            className="testimonial-modal__icon-btn"
            type="button"
            aria-label="Anterior"
            onClick={onPrevious}
          >
            &lsaquo;
          </button>
          <button
            className="testimonial-modal__icon-btn"
            type="button"
            aria-label="Siguiente"
            onClick={onNext}
          >
            &rsaquo;
          </button>
          <button
            className="testimonial-modal__icon-btn testimonial-modal__icon-btn--close"
            type="button"
            aria-label="Cerrar"
            onClick={onClose}
          >
            x
          </button>
        </div>
        <div className="testimonial-modal__content">
          <Image
            className="testimonial-modal__avatar"
            src={slide.image}
            alt={slide.alt}
            width={224}
            height={224}
            sizes="112px"
            loading="lazy"
          />
          <p className="testimonial-modal__quote">{slide.quote}</p>
          <p className="testimonial-modal__author">{slide.author}</p>
        </div>
      </div>
    </div>
  );
}

export const TestimonialDetailModal = memo(TestimonialDetailModalComponent);
