import { revalidatePath } from "next/cache";

export function revalidatePublicSitemap() {
  revalidatePath("/sitemap.xml");
}

export function revalidatePublicRobots() {
  revalidatePath("/robots.txt");
}
