"use client";

import Link from "next/link";
import Image from "next/image";
import { assetPath } from "@/lib/assets";
import { Carousel } from "@/components/ui/Carousel";
import type { HomeIntroSlide } from "@/lib/cms/types";

/** Slide destacada: se muestra más grande que el resto en móvil. */
const FEATURED_SLIDE_ID = "intro-1788248293295";

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
        slideClassName="home-intro-slider__slide grid h-full min-h-0 min-w-0 flex-[0_0_100%] grid-cols-2 items-center gap-[14px] max-[1024px]:gap-3 max-[640px]:grid-cols-1 max-[640px]:gap-4 max-[640px]:text-center"
        dotsClassName="absolute inset-x-0 bottom-5 z-[2] m-0 flex items-center justify-center gap-2"
        dotClassName="h-[10px] w-[10px] rounded-full border-0 bg-[rgba(157,148,139,0.4)] p-0 transition-[transform,background-color] duration-150 ease-in-out aria-[pressed=true]:scale-[1.08] aria-[pressed=true]:bg-[#70665d] focus-visible:outline-2 focus-visible:outline-[rgba(111,98,85,0.5)] focus-visible:outline-offset-4"
        showDots
        autoPlayMs={4000}
        getSlideId={(slide) => slide.id}
        renderItem={(slide) => {
          const isFeatured = slide.id === FEATURED_SLIDE_ID;
          return (
            <>
              <div className="flex h-full min-h-0 w-full items-center justify-end max-[640px]:justify-center">
                <Image
                  src={/^https?:\/\//i.test(slide.image) ? slide.image : assetPath(slide.image)}
                  alt={slide.imageAlt}
                  width={480}
                  height={480}
                  // Preserve the CMS image detail instead of generating a small carousel thumbnail.
                  unoptimized
                  loading="lazy"
                  style={isFeatured ? { transform: "scale(1.15)" } : undefined}
                  className={`home-intro-slider__image block w-full max-w-60 object-contain${
                    isFeatured ? " home-intro-slider__image--featured" : ""
                  }`}
                />
              </div>
              <div
                className={`home-intro-slider__copy flex items-center justify-start max-[640px]:justify-center${
                  isFeatured ? " home-intro-slider__copy--featured" : ""
                }`}
              >
                <div className="w-full max-w-84 text-center max-[1024px]:max-w-72 max-[640px]:max-w-full">
                  {isFeatured ? <h2 className="home-intro-slider__title">DESCUBRE LA CERÁMICA</h2> : null}
                  <p className="home-intro-slider__text m-0 text-[24px] font-light leading-[1.22] text-[#5f5852] max-[640px]:mx-auto max-[640px]:max-w-[300px] max-[640px]:text-[15px] max-[640px]:leading-[1.3]">
                    {slide.text}
                  </p>
                  {slide.showButton !== false ? (
                    <Link
                      className="home-intro-slider__link mt-6.75 inline-flex min-h-9.75 items-center justify-center border border-[rgba(111,98,85,0.5)] px-5.25 text-[10px] font-normal uppercase leading-none tracking-[0.14em] text-[#655b53] no-underline transition-[background-color,color,border-color] duration-150 ease-in-out hover:border-[#8b7461] hover:bg-[#8b7461] hover:text-[#fbfaf6] focus-visible:border-[#8b7461] focus-visible:bg-[#8b7461] focus-visible:text-[#fbfaf6] max-[1024px]:mt-5 max-[1024px]:min-h-10 max-[640px]:mt-4 max-[640px]:min-h-9 max-[640px]:px-4 max-[640px]:text-[11px]"
                      href={slide.buttonHref}
                    >
                      {slide.buttonText}
                    </Link>
                  ) : null}
                </div>
              </div>
            </>
          );
        }}
      />
    </section>
  );
}
