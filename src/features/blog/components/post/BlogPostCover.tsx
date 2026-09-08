import type { BlogPost } from "@/data/types";
import { assetPath } from "@/lib/assets";

export function BlogPostCover({ post }: { post: BlogPost }) {
  if (!post.featuredImage) return null;

  return (
    <figure className="blog-article__cover">
      <img
        src={assetPath(post.featuredImage)}
        alt={post.title}
        loading="eager"
        decoding="async"
        fetchPriority="high"
      />
    </figure>
  );
}
