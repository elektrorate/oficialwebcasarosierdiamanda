import { memo } from "react";
import type { TestimonialSlide } from "../types";

function TestimonialSlideContentComponent({ slide, variant = "default" }: { slide: TestimonialSlide; variant?: "default" | "home" }) {
  const isHome = variant === "home";

  return (
    <>
      <img
        className={isHome ? "h-[clamp(96px,9vw,112px)] w-[clamp(96px,9vw,112px)] rounded-full object-cover max-[640px]:h-[clamp(72px,22vw,88px)] max-[640px]:w-[clamp(72px,22vw,88px)]" : "testimonial__avatar"}
        src={slide.image}
        alt={slide.alt}
        loading="lazy"
        decoding="async"
      />
      <div className={isHome ? "pt-0 text-left" : "testimonial__body"}>
        <p className={isHome ? "m-0 max-w-[38ch] [font-family:var(--font-manrope)] text-[clamp(15px,1.35vw,17px)] font-light leading-[1.55] text-[#4a4a4a] max-[640px]:max-w-none max-[640px]:text-[15px] max-[640px]:leading-[1.52]" : "testimonial__quote"}>{slide.quote}</p>
        <p className={isHome ? "mt-[clamp(10px,1.2vw,14px)] mb-0 [font-family:var(--font-manrope)] text-[clamp(12px,1.05vw,13px)] font-light leading-[1.4] text-[#6a6a6a]" : "testimonial__author"}>{slide.author}</p>
      </div>
    </>
  );
}

export const TestimonialSlideContent = memo(TestimonialSlideContentComponent);
