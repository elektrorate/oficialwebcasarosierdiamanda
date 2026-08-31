import Link from "next/link";
import { MarkdownContent } from "@/components/ui/MarkdownContent";
import type { ExperienceItem } from "@/data/types";
import { assetPath } from "@/lib/assets";
import { experienceHref } from "@/lib/routes";

export function CollectionCard({ item }: { item: ExperienceItem }) {
  const href = experienceHref(item.kind, item.slug);
  const imgSrc = assetPath(item.coverImage);
  const isFallback = imgSrc !== `/${item.coverImage}`;

  return (
    <article className="w-full">
      <Link className="block aspect-[0.92/1] bg-[#ddd] overflow-hidden relative" href={href}>
        <img
          src={imgSrc}
          alt={item.title}
          className={isFallback ? "block w-full h-full object-cover bg-transparent" : "block w-full h-full object-cover"}
          loading="lazy"
          decoding="async"
        />
      </Link>
      <div className="pt-3.5 pb-0 border-0">
        <p className="mb-2.5 text-[20px]/[1.2] font-light tracking-[0.04em] uppercase text-[#7a7a7a] [font-family:var(--font-menu)]">{item.category}</p>
        <h3 className="mb-2.5 text-[18px]/[1.15] font-normal text-[#3e3e3e] [font-family:var(--font-display)]">{item.title}</h3>
        <MarkdownContent className="mb-3 text-[17px]  text-[#545454] [font-family:var(--font-display)]" source={item.excerpt} />
        <Link className="text-[10px] tracking-[0.12em] uppercase no-underline inline-flex items-center gap-1.75 text-[#555] [font-family:var(--font-menu)] before:content-[''] before:w-5 before:h-px before:bg-current" href={href}>
          leer mas
        </Link>
      </div>
    </article>
  );
}
