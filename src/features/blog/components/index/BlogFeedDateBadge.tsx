import { formatBlogDateBadge } from "../../lib/formatBlogDateBadge";

export function BlogFeedDateBadge({ publishedAt, timeZone }: { publishedAt: string; timeZone?: string }) {
  const label = formatBlogDateBadge(publishedAt, timeZone);
  if (!label) return null;

  return (
    <time className="blog-feed-card__badge" dateTime={publishedAt}>
      {label}
    </time>
  );
}
