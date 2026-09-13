import Link from "next/link";
import Image from "next/image";
import type { BlogPost } from "@/data/types";
import { assetPath } from "@/lib/assets";
import { BlogFeaturedSlideCard } from "./BlogFeaturedSlideCard";

export function BlogFeaturedSlide({ post }: { post: BlogPost }) {
  const image = post.featuredImage ?? post.coverImage;

  return (
    <>
      <div className="blog-featured-slide__peek blog-featured-slide__peek--media" aria-hidden="true">
        <Image src={assetPath(image)} alt="" width={1200} height={750} sizes="20vw" />
      </div>
      <Link className="blog-featured-slide__main" href={`/blog/${post.slug}`}>
        <Image
          className="blog-featured-slide__main-image"
          src={assetPath(image)}
          alt={post.title}
          width={1600}
          height={1000}
          sizes="(max-width: 760px) 90vw, 70vw"
          quality={85}
        />
      </Link>
      <BlogFeaturedSlideCard post={post} />
    </>
  );
}
