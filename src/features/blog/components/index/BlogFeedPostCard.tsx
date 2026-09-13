import Link from "next/link";
import Image from "next/image";
import { MarkdownContent } from "@/components/ui/MarkdownContent";
import type { BlogPost } from "@/data/types";
import { assetPath } from "@/lib/assets";
import { resolveBlogCardExcerpt } from "../../lib/resolveBlogCardExcerpt";
import { BlogFeedDateBadge } from "./BlogFeedDateBadge";

export function BlogFeedPostCard({ post }: { post: BlogPost }) {
  const excerpt = resolveBlogCardExcerpt(post);

  return (
    <article className="blog-feed-card">
      <Link className="blog-feed-card__media" href={`/blog/${post.slug}`}>
        <Image
          src={assetPath(post.coverImage)}
          alt={post.title}
          width={1200}
          height={750}
          sizes="(max-width: 760px) 75vw, 65vw"
          loading="lazy"
        />
        <BlogFeedDateBadge publishedAt={post.publishedAt} />
      </Link>
      <div className="blog-feed-card__body">
        <p className="blog-feed-card__category">{post.category}</p>
        <h2 className="blog-feed-card__title">
          <Link href={`/blog/${post.slug}`}>{post.title}</Link>
        </h2>
        {excerpt ? (
          <MarkdownContent className="blog-feed-card__excerpt" source={excerpt} />
        ) : null}
        <Link className="blog-feed-card__cta" href={`/blog/${post.slug}`}>
          leer Más
        </Link>
      </div>
    </article>
  );
}
