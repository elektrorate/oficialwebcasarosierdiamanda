import type { BlogPost } from "@/data/types";
import { BlogFeaturedCarousel } from "./BlogFeaturedCarousel";

export function BlogFeaturedSection({ posts }: { posts: BlogPost[] }) {
  if (!posts.length) return null;

  return (
    <section className="blog-index-featured section py-[clamp(8px,1.5vw,16px)] pb-[clamp(40px,5vw,72px)] bg-[#f9f8f3]" aria-label="Artículos destacados">
      <div className="blog-index-featured__container w-[min(100%-24px,1100px)] mx-auto">
        <BlogFeaturedCarousel posts={posts} />
      </div>
    </section>
  );
}
