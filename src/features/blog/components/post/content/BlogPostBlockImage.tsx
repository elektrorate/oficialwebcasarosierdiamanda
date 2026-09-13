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
      <img src={assetPath(src)} alt={alt ?? ""} loading="lazy" decoding="async" />
      {caption ? <figcaption>{caption}</figcaption> : null}
    </figure>
  );
}
