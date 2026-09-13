import Image from "next/image";
import { assetPath } from "@/lib/assets";

export function BlogPostBlockImage({
  src,
  alt,
  caption,
}: {
  src: string;
  alt?: string;
  caption?: string;
}) {
  return (
    <figure className="blog-article__figure">
      <Image
        src={assetPath(src)}
        alt={alt ?? ""}
        width={1400}
        height={900}
        sizes="(max-width: 760px) 100vw, 760px"
        loading="lazy"
      />
      {caption ? <figcaption>{caption}</figcaption> : null}
    </figure>
  );
}
