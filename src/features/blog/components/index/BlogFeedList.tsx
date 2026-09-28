import type { BlogPost } from "@/data/types";
import { BlogFeedPostCard } from "./BlogFeedPostCard";

export function BlogFeedList({ posts, timeZone }: { posts: readonly BlogPost[]; timeZone?: string }) {
  if (!posts.length) {
    return <p className="blog-index-feed__empty">Todavía no hay artículos publicados.</p>;
  }

  return (
    <div className="blog-index-feed__list">
      {posts.map((post) => (
        <BlogFeedPostCard key={post.id} post={post} timeZone={timeZone} />
      ))}
    </div>
  );
}
