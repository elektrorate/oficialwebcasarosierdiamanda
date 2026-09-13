import { assetPath } from "@/lib/assets";

export function BlogPostBlockGallery({
  images,
}: {
  images: Array<{ src: string; alt?: string }>;
}) {
  return (
    <div className="blog-article__gallery">
      {images.map((image) => (
        <figure className="blog-article__gallery-item" key={image.src}>
          <img src={assetPath(image.src)} alt={image.alt ?? ""} loading="lazy" decoding="async" />
        </figure>
      ))}
    </div>
  );
}
