import type { BlogPost } from "@/data/types";
import { assetPath } from "@/lib/assets";

export function BlogPostTitleImage({ post }: { post: BlogPost }) {
  if (!post.titleImage) return null;

  return (
    <figure className="blog-article__title-image">
      <img src={assetPath(post.titleImage)} alt={post.title} loading="eager" decoding="async" />
    </figure>
  );
}
