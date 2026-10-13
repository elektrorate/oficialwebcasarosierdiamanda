"use client";

import { useEffect, useRef, useState } from "react";

const TRUSTINDEX_WIDGET_SRC =
  "https://cdn.trustindex.io/loader.js?f16545b83e584814a4961a14873";
const TRUSTINDEX_WIDGET_SELECTOR =
  ".ti-widget[data-pid='f16545b83e584814a4961a14873']";

export function TrustindexReviewsSection() {
  const [failed, setFailed] = useState(false);
  const widgetHostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const widgetHost = widgetHostRef.current;
    if (!widgetHost) return;

    let renderedWidget: HTMLElement | null = null;

    const placeWidgetInsideSection = () => {
      const widget = document.querySelector<HTMLElement>(
        TRUSTINDEX_WIDGET_SELECTOR,
      );
      if (!widget || widget.parentElement === widgetHost) return;

      renderedWidget = widget;
      widget.style.setProperty("position", "relative", "important");
      widget.style.setProperty("inset", "auto", "important");
      widget.style.setProperty("width", "min(430px, 100%)", "important");
      widget.style.setProperty("margin", "0 auto", "important");
      widget.style.setProperty("z-index", "auto", "important");
      widgetHost.appendChild(widget);
    };

    const observer = new MutationObserver(placeWidgetInsideSection);
    observer.observe(document.body, { childList: true });

    const script = document.createElement("script");
    script.src = TRUSTINDEX_WIDGET_SRC;
    script.async = true;
    script.defer = true;
    script.onerror = () => setFailed(true);
    widgetHost.appendChild(script);
    placeWidgetInsideSection();

    return () => {
      observer.disconnect();
      script.onerror = null;
      renderedWidget?.remove();
      widgetHost.replaceChildren();
    };
  }, []);

  return (
    <section
      id="testimonio"
      aria-labelledby="trustindex-reviews-title"
      className="home-testimonial bg-[#fbfaf6] pt-[clamp(52px,6.5vw,76px)] pb-[clamp(56px,7vw,80px)]"
    >
      <div className="container mx-auto max-w-285 px-6 max-[640px]:px-5">
        <header className="mb-[clamp(36px,4.5vw,48px)] text-center">
          <h2
            id="trustindex-reviews-title"
            className="m-0 [font-family:var(--font-manrope)] text-[clamp(28px,3.2vw,40px)] font-light leading-[1.1] tracking-[0.01em] text-[#2e2e2e]"
          >
            Lo que dicen de Nosotros
          </h2>
          <p className="m-0 mt-[clamp(10px,1.4vw,14px)] [font-family:var(--font-manrope)] text-[clamp(13px,1.15vw,15px)] font-light leading-[1.4] tracking-[0.02em] text-[#666]">
            Reseñas verificadas de nuestros clientes
          </p>
        </header>

        <div
          ref={widgetHostRef}
          className="mx-auto flex min-h-50 w-full max-w-250 justify-center"
          aria-live="polite"
        />
        {failed ? (
          <p className="m-0 py-12 text-center [font-family:var(--font-manrope)] text-sm font-light text-[#666]">
            Las reseñas no están disponibles en este momento.
          </p>
        ) : null}
      </div>
    </section>
  );
}
