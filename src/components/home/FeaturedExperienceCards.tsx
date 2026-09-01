import Link from "next/link";
import type { ExperienceItem } from "@/data/types";
import { assetPath } from "@/lib/assets";
import {
  DEFAULT_RICH_TEXT_TYPOGRAPHY,
  normalizeRichTextTypography,
  richTextTypographyStyle,
} from "@/lib/cms/rich-text-typography";
import { experienceHref } from "@/lib/routes";
import { truncateHomeFlipExcerpt } from "@/lib/text/plain-text";
import { classNames } from "@/lib/utils";

function homeCardExcerpt(item: ExperienceItem) {
  const raw = item.homeExcerpt || item.excerpt;
  return raw.trim() || "Descubre esta experiencia en Casa Rosier.";
}

export function FeaturedExperienceCards({ items }: { items: readonly ExperienceItem[] }) {
  return (
    <>
      {items.map((item) => {
        const href = experienceHref(item.kind, item.slug);
        const image = item.homeImage || item.coverImage;
        const resolvedImage = assetPath(image);
        const label = item.homeTitle || item.title;
        const excerptTypography = normalizeRichTextTypography(
          item.homeExcerptTypography ?? DEFAULT_RICH_TEXT_TYPOGRAPHY,
        );
        const excerptStyle = richTextTypographyStyle(excerptTypography);
        const flipExcerpt = truncateHomeFlipExcerpt(homeCardExcerpt(item));

        return (
          <article className="content-card--home-flip group mx-auto w-full" key={item.id}>
            <Link
              className="block text-inherit no-underline focus-visible:outline-2 focus-visible:outline-[#8c7457] focus-visible:outline-offset-4"
              href={href}
              aria-label={`Ver ${label}`}
            >
              <div className="relative aspect-square overflow-hidden bg-[#e8e4dc]">
                <div className="relative h-full w-full">
                  <div className="absolute inset-0 z-1 opacity-100 transition-opacity duration-280 ease-in-out group-hover:opacity-0 group-focus-within:opacity-0">
                    <img
                      className={classNames(
                        "block h-full w-full object-cover",
                        resolvedImage !== `/${image}` && "asset-fallback",
                      )}
                      src={resolvedImage}
                      alt=""
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  <div className="pointer-events-none absolute inset-0 z-2 flex items-center justify-center overflow-hidden bg-[#f7f5f0] p-[clamp(16px,4vw,28px)] text-center opacity-0 transition-opacity duration-280 ease-in-out group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100">
                    <p
                      className="m-0 line-clamp-10 w-full max-w-[28ch] overflow-hidden text-ellipsis [font-family:var(--font-baskervville)] text-[clamp(13px,1.35vw,16px)] font-light leading-[1.45] text-[#5a5a5a] text-pretty max-[640px]:line-clamp-9 max-[640px]:max-w-[26ch] max-[640px]:text-[15px] max-[640px]:leading-[1.42]"
                      style={excerptStyle}
                    >
                      {flipExcerpt}
                    </p>
                  </div>
                </div>
              </div>
              <p
                className="mt-[clamp(11px,1.9vw,15px)] mb-0 whitespace-pre-line px-[clamp(4px,1vw,8px)] text-center [font-family:var(--font-nunito)] text-[clamp(13px,1.05vw,15px)] font-light tracking-[0.07em] text-[#4a4a4a] max-[640px]:mt-3.25 max-[640px]:text-[13px] max-[640px]:tracking-[0.06em]"
                style={{ lineHeight: item.homeTitleTypography?.lineHeight ?? 1.38 }}
              >
                {label}
              </p>
            </Link>
          </article>
        );
      })}
    </>
  );
}
