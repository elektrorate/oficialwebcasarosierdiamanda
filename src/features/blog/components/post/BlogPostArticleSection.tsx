import type { BlogPost } from "@/data/types";
import type { BlogPostAdjacent } from "../../loadBlogPostPage";
import { BlogPostArticleBody } from "./BlogPostArticleBody";
import { BlogPostCover } from "./BlogPostCover";
import { BlogPostCta } from "./BlogPostCta";
import { BlogPostIntro } from "./BlogPostIntro";
import { BlogPostPager } from "./BlogPostPager";
import { BlogPostTitle } from "./BlogPostTitle";

export function BlogPostArticleSection({
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
    <>
      <article className="blog-article section py-[clamp(28px,4vw,48px)] pb-[clamp(32px,4vw,56px)] bg-[#f9f8f3]">
        <div className="blog-article__container w-[min(100%-40px,640px)] mx-auto">
          <header className="blog-article__header mb-[clamp(28px,4vw,40px)] text-center">
            <BlogPostTitle title={post.title} />
            <BlogPostIntro post={post} />
          </header>
          <BlogPostCover post={post} />
          <BlogPostArticleBody blocks={post.contentBlocks} />
        </div>
      </article>
      <BlogPostCta />
      <BlogPostPager adjacent={adjacent} position={position} total={total} />
    </>
  );
}
