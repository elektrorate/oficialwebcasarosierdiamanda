import type { ExperienceItem } from "@/data/types";
import { CollectionCard } from "@/components/collections/CollectionCard";

export function CollectionGrid({
  items,
  lede
}: {
  items: readonly ExperienceItem[];
  lede: string;
}) {
  return (
    <section className="featured section bg-[#fbfaf6] pt-7 pb-13">
      <div className="container featured__container max-w-265">
        <header className="featured__head text-center mb-10.5">
          <p className="featured__lede max-w-[32ch] mx-auto mt-4 text-center text-[#6e665f] font-light text-[18px]/[1.7] [font-family:var(--font-menu)] max-[992px]:text-[14px] max-[992px]:leading-[1.6]">{lede}</p>
        </header>
        <div className="featured__grid cards-grid grid grid-cols-3 row-gap-[42px] max-[992px]:grid-cols-2 max-[992px]:row-gap-[34px] max-[992px]:col-gap-[19px] max-[640px]:grid-cols-1">
          {items.map((item) => (
            <CollectionCard item={item} key={item.id} />
          ))}
        </div>
      </div>
    </section>
  );
}
