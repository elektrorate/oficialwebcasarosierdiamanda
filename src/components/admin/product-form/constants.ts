export { MEDIA_UPLOAD_ENDPOINT } from "@/lib/admin/media-upload-client";

export const PRODUCT_LIST_PATH = "/admin/shop?tab=items";

export const STATUS_LABELS: Record<string, string> = {
  draft: "Borrador",
  published: "Publicado",
  archived: "Archivado",
};

export const DEFAULT_CTA_LABEL = "Comprar";
export const DEFAULT_CTA_URL = "";
export const DEFAULT_LOW_STOCK_THRESHOLD = 5;

export const CATEGORIES_ENDPOINT = "/api/admin/shop/categories?usable=1";
export const CATEGORIES_ADMIN_PATH = "/admin/shop/categories";
export const PRODUCTS_ENDPOINT = "/api/admin/shop/products";
export const PRODUCT_MEDIA_FOLDER = "shop";
