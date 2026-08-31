"use client";

import { memo } from "react";
import { Carousel } from "@/components/ui/Carousel";
import { HOME_TESTIMONIAL_SECTION_COPY, TESTIMONIAL_SECTION_COPY } from "../constants";
import type { TestimonialSlide } from "../types";
import { TestimonialSlideContent } from "./TestimonialSlideContent";

function TestimonialCarouselSectionComponent({
  testimonials,
  onOpenSlide,
  variant = "default",
}: {
  testimonials: TestimonialSlide[];
  onOpenSlide: (index: number) => void;
  variant?: "default" | "home";
}) {
  const copy = variant === "home" ? HOME_TESTIMONIAL_SECTION_COPY : TESTIMONIAL_SECTION_COPY;
  const isHome = variant === "home";

  return (
    <section
      id="testimonio"
      className={isHome ? "home-testimonial bg-[#fbfaf6] pt-[clamp(52px,6.5vw,76px)] pb-[clamp(56px,7vw,80px)]" : "testimonial section"}
    >
      <div className={isHome ? "container mx-auto max-w-180" : "container testimonial__container"}>
        <header className={isHome ? "mb-[clamp(36px,4.5vw,48px)] text-center" : "testimonial__head"}>
          <h2 className={isHome ? "m-0 [font-family:var(--font-manrope)] text-[clamp(28px,3.2vw,40px)] font-light leading-[1.1] tracking-[0.01em] text-[#2e2e2e]" : "testimonial__title section-title"}>
            {copy.title.split("\n").map((line, index, lines) => (
              <span key={`${line}-${index}`}>
                {line}
                {index < lines.length - 1 && <br />}
              </span>
            ))}
          </h2>
          <p className={isHome ? "m-0 mt-[clamp(10px,1.4vw,14px)] [font-family:var(--font-manrope)] text-[clamp(13px,1.15vw,15px)] font-light leading-[1.4] tracking-[0.02em] text-[#666]" : "testimonial__subtitle section-subtitle"}>{copy.subtitle}</p>
        </header>
        <Carousel
          items={testimonials}
          ariaLabel={copy.carouselAriaLabel}
          className={isHome ? "m-0" : "testimonial__carousel"}
          viewportClassName={isHome ? "mx-auto max-w-[min(640px,100%)] overflow-hidden max-[640px]:w-full max-[640px]:max-w-full" : "testimonial__viewport"}
          trackClassName={isHome ? "flex w-full transition-transform duration-[420ms] ease-in-out will-change-transform" : "testimonial__track"}
          slideClassName={isHome ? "grid flex-[0_0_100%] grid-cols-[clamp(96px,9vw,112px)_minmax(0,1fr)] items-center gap-[clamp(20px,2.8vw,28px)] rounded-none bg-transparent p-0 max-[640px]:grid-cols-[clamp(72px,22vw,88px)_minmax(0,1fr)] max-[640px]:items-start max-[640px]:gap-4" : "testimonial__slide"}
          dotsClassName={isHome ? "mt-[clamp(32px,4vw,42px)] flex justify-center gap-2.5" : "testimonial__dots"}
          dotClassName={isHome ? "h-[9px] w-[9px] rounded-full border-0 bg-[rgba(118,111,104,0.28)] p-0 transition-transform duration-150 ease-in-out aria-[pressed=true]:bg-[#4a4540]" : "testimonial__dot"}
          showDots
          dotLabel={(slideIndex) => copy.dotLabel(slideIndex)}
          getSlideProps={(_, { realIndex }) => ({
            tabIndex: 0,
            onClick: () => onOpenSlide(realIndex),
            onKeyDown: (event) => {
              if (event.key === "Enter" || event.key === " ") {
                onOpenSlide(realIndex);
              }
            },
          })}
          renderItem={(testimonial) => <TestimonialSlideContent slide={testimonial} variant={variant} />}
        />
      </div>
    </section>
  );
}

export const TestimonialCarouselSection = memo(TestimonialCarouselSectionComponent);
