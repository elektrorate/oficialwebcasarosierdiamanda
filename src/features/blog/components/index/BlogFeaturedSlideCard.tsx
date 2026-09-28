import Link from "next/link";
import { MarkdownContent } from "@/components/ui/MarkdownContent";
import type { BlogPost } from "@/data/types";
import { formatDate } from "@/lib/utils";
import { resolveBlogCardExcerpt } from "../../lib/resolveBlogCardExcerpt";

export function BlogFeaturedSlideCard({ post, timeZone }: { post: BlogPost; timeZone?: string }) {
  const excerpt = post.featuredExcerpt?.trim() || resolveBlogCardExcerpt(post);

  return (
    <article className="blog-featured-slide__card">
      <p className="blog-featured-slide__category">{post.category}</p>
      <h3 className="blog-featured-slide__title">
        <Link href={`/blog/${post.slug}`}>{post.title}</Link>
      </h3>
      {excerpt ? (
        <MarkdownContent className="blog-featured-slide__excerpt" source={excerpt} />
      ) : null}
      <div className="blog-featured-slide__meta">
        <span className="blog-featured-slide__avatar" aria-hidden="true">
          {post.authorInitial || post.author.charAt(0)}
        </span>
        <div className="blog-featured-slide__byline">
          <strong>{post.author}</strong>
          <time dateTime={post.publishedAt}>{formatDate(post.publishedAt, timeZone)}</time>
        </div>
      </div>
    </article>
  );
}
