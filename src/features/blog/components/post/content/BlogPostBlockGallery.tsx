import Image from "next/image";
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
          <Image
            src={assetPath(image.src)}
            alt={image.alt ?? ""}
            width={900}
            height={900}
            sizes="(max-width: 640px) 100vw, 50vw"
            loading="lazy"
          />
        </figure>
      ))}
    </div>
  );
}
