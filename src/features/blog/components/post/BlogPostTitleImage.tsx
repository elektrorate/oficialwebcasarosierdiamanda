import Image from "next/image";
import type { BlogPost } from "@/data/types";
import { assetPath } from "@/lib/assets";

export function BlogPostTitleImage({ post }: { post: BlogPost }) {
  if (!post.titleImage) return null;

  return (
    <figure className="blog-article__title-image">
      <Image
        src={assetPath(post.titleImage)}
        alt={post.title}
        width={1000}
        height={700}
        sizes="(max-width: 560px) calc(100vw - 32px), 500px"
        quality={85}
        loading="eager"
      />
    </figure>
  );
}
