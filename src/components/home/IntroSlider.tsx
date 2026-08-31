"use client";

import Link from "next/link";
import { assetPath } from "@/lib/assets";
import { Carousel } from "@/components/ui/Carousel";
import type { HomeIntroSlide } from "@/lib/cms/types";

export function IntroSlider({ slides }: { slides: readonly HomeIntroSlide[] }) {
  const visibleSlides = [...slides]
    .filter((slide) => slide.isVisible !== false)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  if (!visibleSlides.length) return null;

  return (
    <section
      id="intro"
      className="home-intro-slider-marker relative box-border h-120 overflow-hidden bg-[#fbfaf6] pt-11.25 pb-16.5 max-[1024px]:h-auto max-[1024px]:min-h-110 max-[1024px]:pt-9 max-[1024px]:pb-12 max-[640px]:min-h-100"
    >
      <Carousel
        items={visibleSlides}
        ariaLabel="Introduccion visual Casa Rosier"
        className="container mx-auto flex h-full max-w-208 flex-col justify-center"
        viewportClassName="h-full overflow-hidden"
        trackClassName="flex h-full w-full transition-transform duration-[700ms] ease-in-out will-change-transform"
        slideClassName="grid h-full min-h-0 min-w-0 flex-[0_0_100%] grid-cols-2 items-center gap-[14px] max-[1024px]:gap-3 max-[640px]:grid-cols-1 max-[640px]:gap-4 max-[640px]:text-center"
        dotsClassName="absolute inset-x-0 bottom-5 z-[2] m-0 flex items-center justify-center gap-2"
        dotClassName="h-[10px] w-[10px] rounded-full border-0 bg-[rgba(157,148,139,0.4)] p-0 transition-[transform,background-color] duration-150 ease-in-out aria-[pressed=true]:scale-[1.08] aria-[pressed=true]:bg-[#70665d] focus-visible:outline-2 focus-visible:outline-[rgba(111,98,85,0.5)] focus-visible:outline-offset-4"
        showDots
        autoPlayMs={4000}
        getSlideId={(slide) => slide.id}
        renderItem={(slide) => (
          <>
            <div className="flex h-full min-h-0 w-full items-center justify-end max-[640px]:justify-center">
              <img
                src={assetPath(slide.image)}
                alt={slide.imageAlt}
                loading="lazy"
                decoding="async"
                className="block w-full max-w-60 px-8 sm:px-0 object-contain max-[640px]:max-w-40"
              />
            </div>
            <div className="flex items-center justify-start max-[640px]:justify-center">
              <div className="w-full max-w-84 text-center max-[1024px]:max-w-72 max-[640px]:max-w-full">
                <p className="m-0 text-[24px] font-light leading-[1.22] text-[#5f5852] max-[640px]:text-[18px] max-[640px]:leading-[1.3]">
                  {slide.text}
                </p>
                <Link
                  className="mt-6.75 inline-flex min-h-9.75 items-center justify-center border border-[rgba(111,98,85,0.5)] px-5.25 text-[10px] font-normal uppercase leading-none tracking-[0.14em] text-[#655b53] no-underline transition-[background-color,color,border-color] duration-150 ease-in-out hover:border-[#8b7461] hover:bg-[#8b7461] hover:text-[#fbfaf6] focus-visible:border-[#8b7461] focus-visible:bg-[#8b7461] focus-visible:text-[#fbfaf6] max-[1024px]:mt-5 max-[1024px]:min-h-10 max-[640px]:mt-4 max-[640px]:min-h-9 max-[640px]:px-4 max-[640px]:text-[11px]"
                  href={slide.buttonHref}
                >
                  {slide.buttonText}
                </Link>
              </div>
            </div>
          </>
        )}
      />
    </section>
  );
}
