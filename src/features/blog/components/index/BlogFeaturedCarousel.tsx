"use client";

import type { BlogPost } from "@/data/types";
import { useSiteTimeZone } from "@/components/layout/SiteTimeZoneProvider";
import { Carousel } from "@/components/ui/Carousel";
import { BlogFeaturedSlide } from "./BlogFeaturedSlide";

export function BlogFeaturedCarousel({ posts, timeZone }: { posts: readonly BlogPost[]; timeZone?: string }) {
  const contextTimeZone = useSiteTimeZone();
  const resolvedTimeZone = timeZone ?? contextTimeZone;
  if (!posts.length) return null;

  return (
    <Carousel
      items={posts}
      ariaLabel="Artículos destacados del blog"
      className="blog-featured-carousel"
      viewportClassName="blog-featured-carousel__viewport"
      trackClassName="blog-featured-carousel__track"
      slideClassName="blog-featured-slide"
      arrowClassName="blog-featured-carousel__arrow"
      previousArrowClassName="blog-featured-carousel__arrow--prev"
      nextArrowClassName="blog-featured-carousel__arrow--next"
      dotsClassName="blog-featured-carousel__dots"
      dotClassName="blog-featured-carousel__dot"
      showArrows
      showDots
      autoPlayMs={6000}
      previousLabel="Artículo destacado anterior"
      nextLabel="Artículo destacado siguiente"
      dotLabel={(index) => `Ir al destacado ${index + 1}`}
      getSlideId={(post) => `blog-featured-${post.id}`}
      renderItem={(post) => (
        <BlogFeaturedSlide key={post.id} post={post} timeZone={resolvedTimeZone} />
      )}
    />
  );
}
