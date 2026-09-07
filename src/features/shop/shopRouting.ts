import type { Metadata } from "next";
import { getPublicShopData, getPublicShopItemBySlug } from "@/lib/cms/shop-public";
import { loadShopItemPage } from "./loadShopItemPage";

export async function generateShopStaticParams() {
  const { published } = await getPublicShopData();
  return published.map((item) => ({ slug: item.slug }));
}

export async function generateShopItemMetadata(
  params: Promise<{ slug: string }>
): Promise<Metadata> {
  const item = await getPublicShopItemBySlug((await params).slug);
  return item
      ? {
        title: { absolute: item.seoTitle },
        description: item.seoDescription,
        alternates: { canonical: `/shop/${item.slug}` },
      }
    : {};
}

export async function getShopRouteItem(params: Promise<{ slug: string }>) {
  const data = await loadShopItemPage((await params).slug);
  return data?.item ?? null;
}
