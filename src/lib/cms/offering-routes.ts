import { revalidatePath } from "next/cache";
import { invalidatePublicNavigationCache } from "./navigation-public";
import type { Offering } from "./types";

/**
 * Public route for an offering detail page based on its type and slug.
 */
export function publicOfferingPath(offering: Pick<Offering, "type" | "slug"> | null | undefined) {
  if (!offering?.slug) return null;
  if (offering.type === "workshop") return `/workshops/${offering.slug}`;
  if (offering.type === "experience") return `/experiencias/${offering.slug}`;
  if (offering.type === "gift_card") return `/gift-cards/${offering.slug}`;
  return `/clases/${offering.slug}`;
}

/**
 * Invalidates every cache touched by offerings: public navigation, admin
 * listing pages, the homepage, the four public listing pages, the studio and
 * shop pages, plus the individual detail route for each provided offering.
 */
export function refreshOfferingPaths(...offerings: Array<Pick<Offering, "type" | "slug"> | null | undefined>) {
  invalidatePublicNavigationCache();
  revalidatePath("/admin/clases");
  revalidatePath("/admin/workshops");
  revalidatePath("/admin/experiencias");
  revalidatePath("/admin/gift-cards");
  revalidatePath("/");
  revalidatePath("/clases");
  revalidatePath("/workshops");
  revalidatePath("/experiencias");
  revalidatePath("/gift-cards");
  revalidatePath("/el-estudio");
  revalidatePath("/shop");
  for (const offering of offerings) {
    const path = publicOfferingPath(offering);
    if (path) revalidatePath(path);
  }
}