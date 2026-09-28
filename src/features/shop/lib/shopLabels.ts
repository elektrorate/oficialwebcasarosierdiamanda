export const SHOP_LABELS = {
  soldOut: "Agotado",
  buyNow: "Comprar",
  buyNowAlt: "Comprarlo",
  consultPrice: "Consultar",
  available: "Disponible",
  unavailable: "Agotado",
  relatedItems: "Piezas relacionadas",
  emptyCategory: "No hay piezas en esta categoría por ahora.",
  emptyShop: "Todavía no hay piezas publicadas.",
  categoriesLabel: "Categorías",
  actionsFor: "Acciones para",
  viewItem: "Ver",
  galleryOf: "Galería de",
  enlargeImage: "Ampliar imagen de",
  imageOf: "Imagen",
  of: "de",
} as const;

export type ShopLabelKey = keyof typeof SHOP_LABELS;
