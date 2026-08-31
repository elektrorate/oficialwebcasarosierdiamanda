import type { BlogPost } from "@/data/types";
import { BlogFeedList } from "./BlogFeedList";

export function BlogFeedSection({ posts }: { posts: BlogPost[] }) {
  return (
    <section className="blog-index-feed section py-[clamp(16px,3vw,32px)] pb-[clamp(64px,7vw,112px)] bg-[#f9f8f3]" aria-label="Artículos del blog">
      <div className="blog-index-feed__container w-[min(100%-40px,820px)] mx-auto">
        <BlogFeedList posts={posts} />
      </div>
    </section>
  );
}
