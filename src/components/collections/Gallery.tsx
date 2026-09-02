"use client";

import { assetPath } from "@/lib/assets";
import { classNames } from "@/lib/utils";
import { ThumbnailGallery } from "@/components/ui/Carousel";
import type { ExperienceGalleryItem } from "@/data/types";

export function Gallery({
  images,
  title,
  videoImage,
  videoLabel,
  ctaHref,
  showVideo = true
}: {
  images: ExperienceGalleryItem[];
  title: string;
  videoImage?: string;
  videoLabel: string;
  ctaHref?: string;
  showVideo?: boolean;
}) {
  return (
    <div className="class-gallery grid gap-[18px]">
      <ThumbnailGallery
        items={images}
        ariaLabel={`Galeria de ${title}`}
        thumbsClassName="class-gallery__thumbs grid grid-cols-[repeat(4,minmax(0,1fr))] gap-[10px] justify-self-center w-full"
        renderMain={(entry) => (
          <img
            className="class-gallery__main w-full aspect-square object-cover rounded-none shadow-[0_10px_26px_rgba(50,37,20,0.08)]"
            src={assetPath(entry.image)}
            alt={entry.alt || title}
          />
        )}
        renderThumb={(entry, index, isActive, select) => (
          <button
            className={classNames(
              "class-gallery__thumb p-0 border border-[rgba(140,119,93,0.18)] rounded-none bg-transparent overflow-hidden cursor-pointer",
              isActive && "is-active border-[#b06f34] shadow-[0_0_0_1px_rgba(176,111,52,0.16)]"
            )}
            type="button"
            aria-label={`Ver imagen ${index + 1} de ${title}`}
            onClick={select}
          >
            <img src={assetPath(entry.image)} alt={entry.alt || `${title} ${index + 1}`} className="w-full aspect-square object-cover" />
          </button>
        )}
      />
      {showVideo && (videoImage || ctaHref) ? (
        ctaHref ? (
          <a className="class-gallery__video-card relative rounded-none overflow-hidden block" href={ctaHref} target="_blank" rel="noopener noreferrer">
            {videoImage ? <img src={assetPath(videoImage)} alt={title} className="w-full aspect-[1.15/1] object-cover" /> : null}
            <span className="absolute left-[22px] top-1/2 -translate-y-1/2 text-[#fff9f1] text-[clamp(24px,5vw,44px)]/normal [font-family:var(--font-display)] tracking-[0.03em]">{videoLabel || "VIDEO"}</span>
          </a>
        ) : (
          <div className="class-gallery__video-card relative rounded-none overflow-hidden block">
            {videoImage ? <img src={assetPath(videoImage)} alt={title} className="w-full aspect-[1.15/1] object-cover" /> : null}
            <span className="absolute left-[22px] top-1/2 -translate-y-1/2 text-[#fff9f1] text-[clamp(24px,5vw,44px)]/normal [font-family:var(--font-display)] tracking-[0.03em]">{videoLabel || "IMAGEN"}</span>
          </div>
        )
      ) : null}
    </div>
  );
}
