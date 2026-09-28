import type { ShopCategory, ShopItem } from "@/data/types";
import { getCategories } from "./product-categories";
import { getProducts } from "./products";
import type { Product, ProductCategory } from "./types";
import {
  deriveShopProductBadge,
  formatShopPrice,
} from "@/lib/cms/shop-product-presentation";
import { getWhatsappHref } from "@/lib/whatsapp";

export interface ShopSiteConfig {
  siteName: string;
  defaultSeoDescription: string;
}

const DEFAULT_CONFIG: ShopSiteConfig = { siteName: "Casa Rosier", defaultSeoDescription: "" };

function findCategory(product: Product, categories: ProductCategory[]) {
  return categories.find((item) => item.id === product.category_id || item.slug === product.category_id);
}

function categoryKey(product: Product, categories: ProductCategory[]) {
  return findCategory(product, categories)?.id ?? product.category_id ?? "general";
}

function categoryLabel(product: Product, categories: ProductCategory[]) {
  const category = findCategory(product, categories);
  return category?.name ?? "Pieza unica";
}

function detailsFromProduct(product: Product) {
  const details: Record<string, string> = {};
  if (product.sku) details.SKU = product.sku;
  if (product.weight) details.Peso = product.weight;
  if (product.dimensions) details.Medidas = product.dimensions;
  if (product.characteristics) details.Caracteristicas = product.characteristics;
  return details;
}

function orderFromProduct(product: Product) {
  const match = product.sku.match(/(\d+)$/);
  return match ? Number(match[1]) : 0;
}

function productToShopItem(
  product: Product,
  categories: ProductCategory[],
  index: number,
  defaultCtaUrl: string,
  config: ShopSiteConfig = DEFAULT_CONFIG,
): ShopItem {
  const gallery = [product.main_image_id, ...(product.gallery ?? [])].filter(Boolean);

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    category: categoryKey(product, categories),
    categoryLabel: categoryLabel(product, categories),
    price: formatShopPrice(product.price),
    compareAtPrice:
      product.compare_at_price !== null ? formatShopPrice(product.compare_at_price) : null,
    priceAmount: product.price,
    compareAtPriceAmount: product.compare_at_price,
    badge: deriveShopProductBadge(product, { markPopular: index % 5 === 4 }),
    availability: product.stock === null || product.stock > 0 ? "Disponible" : "Agotado",
    image: product.main_image_id || product.seo_image || gallery[0] || "/img/social-2.jpg",
    gallery,
    description: product.description || product.excerpt,
    details: detailsFromProduct(product),
    availabilityNote: product.excerpt || (product.stock === null ? "" : `${product.stock} disponible(s)`),
    ctaLabel: product.cta_label || "Comprar",
    ctaUrl: product.cta_url || defaultCtaUrl,
    seoTitle: product.seo_title || `${product.name} | ${config.siteName}`,
    seoDescription: product.seo_description || product.excerpt || product.description || config.defaultSeoDescription,
    order: orderFromProduct(product),
    isPublished: product.status === "published",
    createdAt: product.created_at,
  };
}

export async function getPublicShopData(config: ShopSiteConfig = DEFAULT_CONFIG) {
  const [products, categories, defaultCtaUrl] = await Promise.all([
    getProducts(),
    getCategories(),
    getWhatsappHref(),
  ]);
  const published = products
    .filter((product) => product.status === "published" && product.deleted_at === null)
    .sort((a, b) => orderFromProduct(a) - orderFromProduct(b) || a.name.localeCompare(b.name, "es"))
    .map((product, index) => productToShopItem(product, categories, index, defaultCtaUrl, config));

  const usedCategoryIds = new Set(published.map((item) => item.category).filter(Boolean));

  const shopCategories: ShopCategory[] = [
    { key: "all", label: "Todas" },
    ...categories
      .filter(
        (category) =>
          category.status === "active" &&
          category.deleted_at === null &&
          usedCategoryIds.has(category.id),
      )
      .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name, "es"))
      .map((category) => ({ key: category.id, label: category.name })),
  ];

  return { published, shopCategories };
}

export async function getPublicShopItemBySlug(slug: string, config: ShopSiteConfig = DEFAULT_CONFIG) {
  const { published } = await getPublicShopData(config);
  return published.find((item) => item.slug === slug) ?? null;
}
