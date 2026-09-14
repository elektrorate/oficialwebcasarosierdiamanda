import { SitePage } from "@/features/shared/layout/SitePage";
import type { BlogPost } from "@/data/types";
import { BlogPostArticleSection } from "./components/post/BlogPostArticleSection";
import { BlogPostPageHeader } from "./components/post/BlogPostPageHeader";
import type { BlogPostAdjacent } from "./loadBlogPostPage";
import { JsonLd } from "@/components/seo/JsonLd";
import { blogPostJsonLd } from "@/lib/seo/structured-data";

export async function BlogPostPage({
  post,
  adjacent,
  position,
  total,
}: {
  post: BlogPost;
  adjacent: BlogPostAdjacent;
  position: number;
  total: number;
}) {
  return (
    <SitePage bodyClass="blog-post-page" header={<BlogPostPageHeader />}>
      <JsonLd data={blogPostJsonLd(post)} />
      <BlogPostArticleSection
        post={post}
        adjacent={adjacent}
        position={position}
        total={total}
      />
    </SitePage>
  );
}
