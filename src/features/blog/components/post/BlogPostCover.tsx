import Image from "next/image";
import type { BlogPost } from "@/data/types";
import { assetPath } from "@/lib/assets";

export function BlogPostCover({ post }: { post: BlogPost }) {
  if (!post.featuredImage) return null;

  return (
    <figure className="blog-article__cover">
      <Image
        src={assetPath(post.featuredImage)}
        alt={post.title}
        width={1600}
        height={1000}
        sizes="(max-width: 760px) 100vw, 900px"
        quality={85}
        loading={post.titleImage ? "lazy" : "eager"}
        fetchPriority={post.titleImage ? "auto" : "high"}
      />
    </figure>
  );
}
