"use client";

import type { ShopCategoryNavItem } from "@/features/shop/lib/buildShopCategoryNav";
import { ALL_CATEGORIES_KEY } from "@/components/shop/hooks/useShopGrid";

type Props = {
  categories: ShopCategoryNavItem[];
  activeCategory: string;
  onSelect: (categoryKey: string) => void;
};

export function ShopCatalogSidebar({ categories, activeCategory, onSelect }: Props) {
  if (!categories.length) return null;

  return (
    <aside className="shop-catalog__sidebar" aria-label="Categorías de la tienda">
      <p className="shop-catalog__sidebar-kicker max-[640px]:text-center!">Categories:</p>
      <nav className="shop-catalog__nav" aria-label="Filtrar por categoría">
        <ul className="shop-catalog__nav-list max-[640px]:justify-center! max-[640px]:gap-y-0! max-[640px]:gap-x-2.5!">
          {categories.map((category) => {
            const isActive = activeCategory === category.key;
            return (
              <li key={category.key}>
                <button
                  type="button"
                  className={`shop-catalog__nav-link max-[640px]:justify-center! max-[640px]:text-center! max-[640px]:!min-h-9${isActive ? " is-active" : ""}`}
                  aria-pressed={isActive}
                  onClick={() =>
                    onSelect(isActive ? ALL_CATEGORIES_KEY : category.key)
                  }
                >
                  {category.label} ({category.count})
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
