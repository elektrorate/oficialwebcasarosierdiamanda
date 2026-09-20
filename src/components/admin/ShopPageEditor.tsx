"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import Link from "@/components/admin/AdminLink";
import { ShopGrid } from "@/components/shop/ShopGrid";
import { NavbarGlobal } from "@/components/layout/NavbarGlobal";
import { PublicHeroContent, PublicHeroTitle } from "@/components/hero/PublicHeroContent";
import type { NavigationItem, ShopCategory, ShopItem } from "@/data/types";
import { normalizeHeroSettings } from "@/lib/cms/hero-settings";
import type { Product, ProductCategory, ShopPageSettings, CmsHeroSettings } from "@/lib/cms/types";
import type { SiteSettings } from "@/lib/cms/settings";
import AdminActionModal from "./AdminActionModal";
import ProductsTable from "./ProductsTable";
import SharedHeroEditor from "./SharedHeroEditor";

type TabKey = "hero" | "items" | "preview";
type ModalState = { type: "success" | "error"; title: string; message?: string } | null;

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: "hero", label: "Hero" },
  { key: "items", label: "Artículos" },
  { key: "preview", label: "Vista previa" },
];

function buildHeroStyle(hero: CmsHeroSettings): Record<string, string> {
  const isImageLike = hero.heroVariant === "image" || hero.heroVariant === "presentation";
  return {
    "--page-hero-image": `url("${hero.heroImage || "/img/social-2.jpg"}")`,
    "--hero-logo-position-x": hero.heroLogoPositionX || "50%",
    "--hero-logo-position-y": hero.heroLogoPositionY || "46px",
    "--hero-logo-width": hero.heroLogoWidth || "118px",
    "--hero-logo-tablet-position-x": hero.heroLogoTabletPositionX || hero.heroLogoPositionX || "50%",
    "--hero-logo-tablet-position-y": hero.heroLogoTabletPositionY || hero.heroLogoPositionY || "42px",
    "--hero-logo-tablet-width": hero.heroLogoTabletWidth || hero.heroLogoWidth || "106px",
    "--hero-logo-mobile-position-x": hero.heroLogoMobilePositionX || hero.heroLogoPositionX || "50%",
    "--hero-logo-mobile-position-y": hero.heroLogoMobilePositionY || "34px",
    "--hero-logo-mobile-width": hero.heroLogoMobileWidth || "92px",
    "--hero-menu-position-y": hero.heroMenuPositionY || "132px",
    "--hero-menu-tablet-position-y": hero.heroMenuTabletPositionY || hero.heroMenuPositionY || "118px",
    "--hero-menu-mobile-position-y": hero.heroMenuMobilePositionY || "96px",
    "--hero-menu-color": hero.heroMenuColor || (isImageLike ? "#ffffff" : "#3f3933"),
    "--hero-menu-scale": String(hero.heroMenuScale ?? 1),
    "--title-image-scale": String(hero.titleImageScale ?? 1),
    "--title-image-position-x": hero.titleImagePositionX || "50%",
    "--title-image-position-y": hero.titleImagePositionY || "50%",
    "--title-image-secondary-scale": String(hero.titleImageSecondaryScale ?? 1),
    "--title-image-secondary-position-x": hero.titleImageSecondaryPositionX || "50%",
    "--title-image-secondary-position-y": hero.titleImageSecondaryPositionY || "50%",
    "--hero-title-position-y": hero.heroTitlePositionY || "50%",
    "--hero-title-scale": String(hero.heroTitleScale ?? 1),
    "--presentation-text-position-x": hero.presentationTextPositionX || "8%",
    "--presentation-text-position-y": hero.presentationTextPositionY || "50%",
    "--presentation-text-scale": String(hero.presentationTextScale ?? 1),
    "--presentation-image-position-x": hero.presentationImagePositionX || "70%",
    "--presentation-image-position-y": hero.presentationImagePositionY || "50%",
    "--presentation-image-scale": String(hero.presentationImageScale ?? 1),
  };
}

export default function ShopPageEditor({
  page,
  products,
  productsPage,
  categories,
  published,
  shopCategories,
  navigationItems,
  menuSettings,
  initialTab = "hero",
}: {
  page: ShopPageSettings;
  products: Product[];
  productsPage: { page: number; total: number; totalPages: number; prevHref?: string; nextHref?: string; q: string };
  categories: ProductCategory[];
  published: ShopItem[];
  shopCategories: ShopCategory[];
  navigationItems: NavigationItem[];
  menuSettings: SiteSettings["menu"];
  initialTab?: TabKey;
}) {
  const [tab, setTab] = useState<TabKey>(initialTab);
  const [status, setStatus] = useState(page.status);
  const [hero, setHero] = useState(() => normalizeHeroSettings(page.hero, {
    heroTitle: "Shop",
    heroSubtitle: "Casa Rosier",
  }));
  const previewCharacteristicLabels = page.previewCharacteristicLabels.join("\n");
  const [seoTitle] = useState(page.seo_title);
  const [seoDescription] = useState(page.seo_description);
  const [seoImage] = useState(page.seo_image);
  const [isLoading, setIsLoading] = useState(false);
  const [modal, setModal] = useState<ModalState>(null);

  async function save(nextStatus = status) {
    setIsLoading(true);
    setModal(null);
    const response = await fetch("/api/admin/shop-page", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: nextStatus,
        hero,
        showCharacteristicsInPreview: true,
        previewCharacteristicLabels: previewCharacteristicLabels.split(/\r?\n|,/).map((item) => item.trim()).filter(Boolean),
        seo_title: seoTitle,
        seo_description: seoDescription,
        seo_image: seoImage,
      }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({})) as { error?: string };
      setModal({ type: "error", title: "No se pudo guardar", message: data.error || "Intenta de nuevo." });
      setIsLoading(false);
      return;
    }

    setStatus(nextStatus);
    setModal({ type: "success", title: nextStatus === "published" ? "Shop publicado" : "Borrador guardado", message: "La configuración de Shop se guardó correctamente." });
    setIsLoading(false);
  }

  return (
    <div className="cms-editor-shell">
      <AdminActionModal open={Boolean(modal)} type={modal?.type} title={modal?.title ?? ""} message={modal?.message} confirmLabel="Entendido" onClose={() => setModal(null)} />

      <header className="cms-page-editor-head">
        <div className="cms-page-editor-head__main">
          <h1>Shop</h1>
          <p>Edición de página pública y catálogo</p>
          <div className="cms-page-editor-meta">
            <span className={`status-pill status-pill--${status}`}>{status}</span>
            <span>{published.length} artículos publicados</span>
            <span>{categories.length} categorias</span>
            <span>Caracteristicas visibles</span>
          </div>
        </div>
        <div className="cms-page-editor-actions">
          <Link className="secondary-btn" href="/admin/dashboard">Volver</Link>
          <button type="button" className="secondary-btn cms-outline-accent" onClick={() => save("draft")} disabled={isLoading}>{isLoading ? "Guardando..." : "Borrador"}</button>
          <button type="button" className="primary-btn" onClick={() => save("published")} disabled={isLoading}>{isLoading ? "Publicando..." : "Publicar"}</button>
        </div>
      </header>

      <nav className="cms-editor-tabs" aria-label="Secciones del editor de Shop">
        {tabs.map((item) => (
          <button type="button" key={item.key} className={tab === item.key ? "is-active" : ""} onClick={() => setTab(item.key)}>
            {item.label}
          </button>
        ))}
      </nav>

      <div className="cms-editor-main">
        {tab === "hero" ? (
          <div className="cms-studio-additions">
            <SharedHeroEditor
              details={hero}
              titleFallback="Shop"
              subtitleFallback="Casa Rosier"
              onChange={(next) => setHero((current) => ({ ...current, ...next }))}
            />
          </div>
        ) : null}

        {tab === "items" ? (
          <section className="form-block cms-editor-card shop-admin-card">
            <div className="cms-editor-card__head shop-admin-card__head">
              <div>
                <p className="auth-kicker">Catálogo</p>
                <h3>Artículos</h3>
              </div>
              <Link className="primary-btn" href="/admin/shop/products/new">Nuevo articulo</Link>
            </div>
            {products.length || productsPage.q ? (
              <>
                <ProductsTable items={products} categories={categories} pagination={productsPage} />
                {productsPage.totalPages > 1 ? (
                  <div className="flex items-center justify-between gap-4 mt-6">
                    <span className="text-label-md text-on-surface-variant">Página {productsPage.page} de {productsPage.totalPages}</span>
                    <div className="flex items-center gap-2">
                      <Link className={productsPage.prevHref ? "secondary-btn" : "secondary-btn pointer-events-none opacity-40"} href={productsPage.prevHref ?? "#"}>Anterior</Link>
                      <Link className={productsPage.nextHref ? "secondary-btn" : "secondary-btn pointer-events-none opacity-40"} href={productsPage.nextHref ?? "#"}>Siguiente</Link>
                    </div>
                  </div>
                ) : null}
              </>
            ) : <p className="muted">No hay artículos todavía.</p>}
          </section>
        ) : null}

        {tab === "preview" ? (
          <ShopPagePreview hero={hero} published={published} shopCategories={shopCategories} navigationItems={navigationItems} menuSettings={menuSettings} />
        ) : null}
      </div>

      <div className="admin-sticky-actionbar">
        <span className="admin-sticky-actionbar__meta">{published.length} artículos publicados · {categories.length} categorías</span>
        <button type="button" className="secondary-btn" onClick={() => setTab("preview")}>Vista previa</button>
        <button type="button" className="secondary-btn" onClick={() => save("draft")} disabled={isLoading}>{isLoading ? "Guardando..." : "Borrador"}</button>
        <button type="button" className="primary-btn" onClick={() => save("published")} disabled={isLoading}>{isLoading ? "Publicando..." : "Publicar"}</button>
      </div>
    </div>
  );
}

function ShopPagePreview({
  hero,
  published,
  shopCategories,
  navigationItems,
  menuSettings,
}: {
  hero: CmsHeroSettings;
  published: ShopItem[];
  shopCategories: ShopCategory[];
  navigationItems: NavigationItem[];
  menuSettings: SiteSettings["menu"];
}) {
  const heroVariant = hero.heroVariant ?? "text";
  const isImageLikeHero = heroVariant === "image" || heroVariant === "presentation";
  const menuTone = hero.heroMenuTone ?? (isImageLikeHero ? "light" : "dark");
  const heroStyle = buildHeroStyle(hero);
  const heightClass = isImageLikeHero ? "header-interno--large" : "header-interno--medium";

  return (
    <div className="cms-preview-frame">
      <div className="cms-public-preview__toolbar">Vista previa de escritorio · Publicado</div>
      <div className="cms-public-preview shop-page">
        <div className="cms-public-preview__scale">
          <div style={heroStyle as CSSProperties}>
            <header
              className={`header-interno page-hero header-interno--ready header-interno--center header-interno--overlay-warm ${isImageLikeHero ? "header-interno--image-hero" : "header-interno--text-hero"} ${heroVariant === "presentation" ? "header-interno--presentation-hero" : ""} header-interno--menu-${menuTone} ${heightClass}`}
            >
              <NavbarGlobal
                navigationItems={navigationItems}
                logoUrl={menuSettings.header_logo_url}
                scrollMenuBackgroundColor={menuSettings.scroll_menu_background_color}
                scrollMenuTextColor={menuSettings.scroll_menu_text_color}
                scrollMenuIconColor={menuSettings.scroll_menu_icon_color}
                scrollMenuLogoTintEnabled={menuSettings.scroll_menu_logo_tint_enabled}
                scrollMenuLogoTintColor={menuSettings.scroll_menu_logo_tint_color}
                heroMenuColor={hero.heroMenuColor}
                heroMenuScale={hero.heroMenuScale}
                heroLogoPositionX={hero.heroLogoPositionX}
                heroLogoPositionY={hero.heroLogoPositionY}
                heroLogoWidth={hero.heroLogoWidth}
                heroLogoTabletPositionX={hero.heroLogoTabletPositionX}
                heroLogoTabletPositionY={hero.heroLogoTabletPositionY}
                heroLogoTabletWidth={hero.heroLogoTabletWidth}
                heroLogoMobilePositionX={hero.heroLogoMobilePositionX}
                heroLogoMobilePositionY={hero.heroLogoMobilePositionY}
                heroLogoMobileWidth={hero.heroLogoMobileWidth}
                heroMenuPositionY={hero.heroMenuPositionY}
                heroMenuTabletPositionY={hero.heroMenuTabletPositionY}
                heroMenuMobilePositionY={hero.heroMenuMobilePositionY}
              />
              {isImageLikeHero ? <PublicHeroContent hero={hero} /> : <PublicHeroTitle hero={hero} title={hero.heroTitle || "Shop"} subtitle={hero.heroSubtitle} />}
            </header>
          </div>
          <ShopGrid published={published} shopCategories={shopCategories} />
        </div>
      </div>
    </div>
  );
}
