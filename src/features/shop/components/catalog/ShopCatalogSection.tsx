"use client";

import type { ShopCategory, ShopItem } from "@/data/types";
import { ShopPagination } from "@/components/shop/components/ShopPagination";
import { useShopCatalog } from "@/features/shop/hooks/useShopCatalog";
import { ShopCatalogGrid } from "./ShopCatalogGrid";
import { ShopCatalogSidebar } from "./ShopCatalogSidebar";

export function ShopCatalogSection({
  published,
  shopCategories = [],
}: {
  published: ShopItem[];
  shopCategories?: ShopCategory[];
}) {
  const catalog = useShopCatalog(published, shopCategories);

  return (
    <section className="shop-catalog section pt-[clamp(28px,4vw,48px)] pb-[clamp(56px,6vw,88px)] overflow-x-clip max-w-full">
      <div className="shop-catalog__container w-[min(100%-40px,1180px)] max-w-full mx-auto box-border max-[640px]:w-[85%]!">
        <div className="shop-catalog__layout grid grid-cols-[minmax(168px,220px)_minmax(0,1fr)] gap-[clamp(32px,4.5vw,64px)] items-start min-w-0 max-w-full max-[960px]:grid-cols-1 max-[960px]:gap-7">
          <ShopCatalogSidebar
            categories={catalog.categories}
            activeCategory={catalog.activeCategory}
            onSelect={catalog.setCategory}
          />

          <div className="shop-catalog__main">
            {catalog.items.length ? (
              <ShopCatalogGrid items={catalog.items} />
            ) : (
              <p className="shop-catalog__empty">
                {published.length
                  ? "No hay piezas en esta categoría por ahora."
                  : "Todavía no hay piezas publicadas."}
              </p>
            )}

            {catalog.showPagination ? (
              <ShopPagination
                page={catalog.page}
                totalPages={catalog.totalPages}
                pages={catalog.pages}
                onPageChange={catalog.setPage}
              />
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
