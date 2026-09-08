import type { BlogPost } from "@/data/types";
import { MarkdownContent } from "@/components/ui/MarkdownContent";
import { resolveBlogPostIntro } from "../../lib/resolveBlogPostIntro";

export function BlogPostIntro({ post }: { post: BlogPost }) {
  const intro = resolveBlogPostIntro(post);
  if (!intro) return null;

  return <MarkdownContent className="blog-article__intro" source={intro} h1Level={2} />;
}
