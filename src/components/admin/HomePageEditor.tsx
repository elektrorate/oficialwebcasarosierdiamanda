"use client";

import { useMemo, useState } from "react";
import { FeaturedSection } from "@/components/home/FeaturedSection";
import { IntroSlider } from "@/components/home/IntroSlider";
import { HomeHeroView, type HomeHeroMenuSettings } from "@/components/layout/HomeHeroView";
import { HomeGiftCardSection } from "@/features/home/HomeGiftCardSection";
import type { ExperienceItem, GiftCardItem, NavigationItem } from "@/data/types";
import type { CmsHeroSettings, HomeIntroSlide, HomePageSettings } from "@/lib/cms/types";
import { normalizeHeroSettings } from "@/lib/cms/hero-settings";
import { saveHomePageSettingsAction } from "@/lib/admin/home-page-actions";
import { assetPath } from "@/lib/assets";
import AdminActionModal from "./AdminActionModal";
import MediaSelectField from "./MediaSelectField";
import SharedHeroEditor from "./SharedHeroEditor";

type TabKey = "hero" | "carousel" | "classes" | "workshops" | "gifts" | "preview";
type ModalState = { type: "success" | "error"; title: string; message?: string } | null;

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: "hero", label: "Hero" },
  { key: "carousel", label: "Carousel destacado" },
  { key: "classes", label: "Clases" },
  { key: "workshops", label: "Workshops" },
  { key: "gifts", label: "Gift Cards" },
  { key: "preview", label: "Vista previa" },
];

function sortBySelected<T extends { id: string }>(items: readonly T[], selectedIds: string[]) {
  const selected = new Set(selectedIds);
  return [...items]
    .filter((item) => selected.has(item.id))
    .sort((a, b) => selectedIds.indexOf(a.id) - selectedIds.indexOf(b.id));
}

function selectedOnly<T extends { id: string }>(items: readonly T[], selectedIds: string[]) {
  return sortBySelected(items, selectedIds);
}

function serializeEditorState(input: {
  status: string;
  hero: CmsHeroSettings;
  introSlides: HomeIntroSlide[];
  classesTitle: string;
  classesSubtitle: string;
  classesFeaturedIds: string[];
  workshopsTitle: string;
  workshopsSubtitle: string;
  workshopsFeaturedIds: string[];
  giftTitle: string;
  giftSubtitle: string;
  giftFeaturedIds: string[];
}) {
  return JSON.stringify({
    ...input,
    hero: input.hero,
    introSlides: input.introSlides.map((slide, sortOrder) => ({ ...slide, sortOrder })),
  });
}

export default function HomePageEditor({
  page,
  classes,
  workshops,
  giftCards,
  navigationItems,
  previewMenu,
}: {
  page: HomePageSettings;
  classes: ExperienceItem[];
  workshops: ExperienceItem[];
  giftCards: GiftCardItem[];
  navigationItems: NavigationItem[];
  previewMenu: {
    headerLogoUrl: string;
    scrollMenuBackgroundColor: string;
    scrollMenuTextColor: string;
    scrollMenuIconColor: string;
    scrollMenuLogoTintEnabled: boolean;
    scrollMenuLogoTintColor: string;
  };
}) {
  const [tab, setTab] = useState<TabKey>("hero");
  const [status, setStatus] = useState(page.status);
  const [hero, setHero] = useState<CmsHeroSettings>(() => normalizeHeroSettings(page.hero, {
    heroTitle: "Casa Rosier",
    heroSubtitle: "Cerámica con las manos",
  }));
  const [introSlides, setIntroSlides] = useState(page.introSlides);
  const [classesTitle, setClassesTitle] = useState(page.classesTitle);
  const [classesSubtitle, setClassesSubtitle] = useState(page.classesSubtitle);
  const [classesFeaturedIds, setClassesFeaturedIds] = useState(page.classesFeaturedIds);
  const [workshopsTitle, setWorkshopsTitle] = useState(page.workshopsTitle);
  const [workshopsSubtitle, setWorkshopsSubtitle] = useState(page.workshopsSubtitle);
  const [workshopsFeaturedIds, setWorkshopsFeaturedIds] = useState(page.workshopsFeaturedIds);
  const [giftTitle, setGiftTitle] = useState(page.giftTitle);
  const [giftSubtitle, setGiftSubtitle] = useState(page.giftSubtitle);
  const [giftFeaturedIds, setGiftFeaturedIds] = useState(page.giftFeaturedIds);
  const [isLoading, setIsLoading] = useState(false);
  const [modal, setModal] = useState<ModalState>(null);
  const currentSnapshot = useMemo(() => serializeEditorState({
    status,
    hero,
    introSlides,
    classesTitle,
    classesSubtitle,
    classesFeaturedIds,
    workshopsTitle,
    workshopsSubtitle,
    workshopsFeaturedIds,
    giftTitle,
    giftSubtitle,
    giftFeaturedIds,
  }), [status, hero, introSlides, classesTitle, classesSubtitle, classesFeaturedIds, workshopsTitle, workshopsSubtitle, workshopsFeaturedIds, giftTitle, giftSubtitle, giftFeaturedIds]);
  const [savedSnapshot, setSavedSnapshot] = useState(() => currentSnapshot);
  const isDirty = currentSnapshot !== savedSnapshot;

  function updateSlide(index: number, next: Partial<HomeIntroSlide>) {
    setIntroSlides((current) => current.map((slide, slideIndex) => slideIndex === index ? { ...slide, ...next } : slide));
  }

  function addSlide() {
    setIntroSlides((current) => [
      {
        id: `intro-${Date.now()}`,
        text: "",
        buttonText: "Ver más",
        buttonHref: "/clases",
        image: "/img/hero-bg.jpg",
        imageAlt: "Imagen de Casa Rosier",
        isVisible: true,
        sortOrder: 0,
      },
      ...current,
    ].map((slide, sortOrder) => ({ ...slide, sortOrder })));
  }

  function removeSlide(index: number) {
    setIntroSlides((current) => current.filter((_, slideIndex) => slideIndex !== index).map((slide, sortOrder) => ({ ...slide, sortOrder })));
  }

  function toggleSelected(id: string, selectedIds: string[], setSelectedIds: (ids: string[]) => void) {
    setSelectedIds(selectedIds.includes(id) ? selectedIds.filter((item) => item !== id) : [...selectedIds, id]);
  }

  async function save(nextStatus = status) {
    setIsLoading(true);
    setModal(null);
    const result = await saveHomePageSettingsAction({
      status: nextStatus,
      hero,
      introSlides: introSlides.map((slide, sortOrder) => ({ ...slide, sortOrder })),
      classesTitle,
      classesSubtitle,
      classesFeaturedIds,
      workshopsTitle,
      workshopsSubtitle,
      workshopsFeaturedIds,
      giftTitle,
      giftSubtitle,
      giftFeaturedIds,
    });

    if (!result.ok) {
      setModal({ type: "error", title: "No se pudo guardar", message: result.error });
      setIsLoading(false);
      return;
    }

    setStatus(nextStatus);
    setHero(result.page.hero);
    setIntroSlides(result.page.introSlides);
    setClassesTitle(result.page.classesTitle);
    setClassesSubtitle(result.page.classesSubtitle);
    setClassesFeaturedIds(result.page.classesFeaturedIds);
    setWorkshopsTitle(result.page.workshopsTitle);
    setWorkshopsSubtitle(result.page.workshopsSubtitle);
    setWorkshopsFeaturedIds(result.page.workshopsFeaturedIds);
    setGiftTitle(result.page.giftTitle);
    setGiftSubtitle(result.page.giftSubtitle);
    setGiftFeaturedIds(result.page.giftFeaturedIds);
    setSavedSnapshot(serializeEditorState({
      status: nextStatus,
      hero: result.page.hero,
      introSlides: result.page.introSlides,
      classesTitle: result.page.classesTitle,
      classesSubtitle: result.page.classesSubtitle,
      classesFeaturedIds: result.page.classesFeaturedIds,
      workshopsTitle: result.page.workshopsTitle,
      workshopsSubtitle: result.page.workshopsSubtitle,
      workshopsFeaturedIds: result.page.workshopsFeaturedIds,
      giftTitle: result.page.giftTitle,
      giftSubtitle: result.page.giftSubtitle,
      giftFeaturedIds: result.page.giftFeaturedIds,
    }));
    setModal({ type: "success", title: nextStatus === "published" ? "Home publicada" : "Borrador guardado", message: "La configuración de Home quedó lista." });
    setIsLoading(false);
  }

  const selectedClasses = selectedOnly(classes, classesFeaturedIds);
  const selectedWorkshops = selectedOnly(workshops, workshopsFeaturedIds);
  const selectedGiftCards = selectedOnly(giftCards, giftFeaturedIds);

  return (
    <div className="cms-editor-shell">
      <AdminActionModal open={Boolean(modal)} type={modal?.type} title={modal?.title ?? ""} message={modal?.message} confirmLabel="Entendido" onClose={() => setModal(null)} />

      <header className="cms-page-editor-head">
        <div className="cms-page-editor-head__main">
          <h1>Home</h1>
          <p>Edición de secciones principales de la página inicial</p>
          <div className="cms-page-editor-meta">
            <span className={`status-pill status-pill--${status}`}>{status}</span>
            <span>{introSlides.filter((slide) => slide.isVisible).length} slides visibles</span>
            <span>{classesFeaturedIds.length} clases en home</span>
            <span>{giftFeaturedIds.length} gift cards</span>
          </div>
        </div>
        <div className="cms-page-editor-actions">
          <button type="button" className="primary-btn" onClick={() => save("published")} disabled={isLoading}>{isLoading ? "Publicando..." : "Publicar"}</button>
        </div>
      </header>

      <nav className="cms-editor-tabs" aria-label="Secciones del editor de Home">
        {tabs.map((item) => (
          <button type="button" key={item.key} className={tab === item.key ? "is-active" : ""} onClick={() => setTab(item.key)}>
            {item.label}
          </button>
        ))}
      </nav>

      <div className="cms-editor-main">
        {tab === "hero" ? (
          <SharedHeroEditor
            details={hero}
            titleFallback="Casa Rosier"
            subtitleFallback="Cerámica con las manos"
            onChange={(next) => setHero((current) => ({ ...current, ...next }))}
          />
        ) : null}

        {tab === "carousel" ? (
          <section className="form-block cms-editor-card cms-home-editor-card">
            <div className="cms-editor-card__head">
              <div>
                <p className="auth-kicker">Home</p>
                <h3>Carousel destacado</h3>
                <p className="cms-editor-card__description">Cada slide usa una imagen de la biblioteca o una subida nueva. No se aceptan URLs manuales para evitar imágenes rotas en producción.</p>
              </div>
              <button type="button" className="primary-btn" onClick={addSlide}>Agregar slide</button>
            </div>
            <div className="cms-home-slides">
              {introSlides.map((slide, index) => (
                <article className="cms-home-slide-card" key={slide.id}>
                  <div className="cms-home-slide-card__media">
                    <MediaSelectField
                      label={`Imagen slide ${index + 1}`}
                      value={slide.image}
                      onChange={(image) => updateSlide(index, { image })}
                      previewClassName="cms-home-slide-card__preview"
                    />
                  </div>
                  <div className="cms-home-slide-card__body">
                    <div className="cms-home-slide-card__head">
                      <div>
                        <p className="auth-kicker">Slide {index + 1}</p>
                        <h4>{slide.buttonText || "Slide sin boton"}</h4>
                      </div>
                      <label className="cms-switch-row">
                        <input type="checkbox" checked={slide.isVisible} onChange={(event) => updateSlide(index, { isVisible: event.target.checked })} />
                        <span>Visible</span>
                      </label>
                    </div>
                    <div className="grid-2">
                      <label className="field span-2"><span>Texto</span><textarea rows={3} value={slide.text} onChange={(event) => updateSlide(index, { text: event.target.value })} /></label>
                      <label className="field"><span>Boton</span><input value={slide.buttonText} onChange={(event) => updateSlide(index, { buttonText: event.target.value })} /></label>
                      <label className="field"><span>Link</span><input value={slide.buttonHref} onChange={(event) => updateSlide(index, { buttonHref: event.target.value })} /></label>
                      <label className="field span-2"><span>Texto alternativo</span><input value={slide.imageAlt} onChange={(event) => updateSlide(index, { imageAlt: event.target.value })} /></label>
                    </div>
                    <div className="cms-home-slide-card__actions">
                      <button type="button" className="danger-btn" onClick={() => removeSlide(index)}>Eliminar slide</button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {tab === "classes" ? (
          <FeaturedPicker title={classesTitle} subtitle={classesSubtitle} items={classes} selectedIds={classesFeaturedIds} onTitleChange={setClassesTitle} onSubtitleChange={setClassesSubtitle} onToggle={(id) => toggleSelected(id, classesFeaturedIds, setClassesFeaturedIds)} emptyText="No hay clases publicadas." />
        ) : null}

        {tab === "workshops" ? (
          <FeaturedPicker title={workshopsTitle} subtitle={workshopsSubtitle} items={workshops} selectedIds={workshopsFeaturedIds} onTitleChange={setWorkshopsTitle} onSubtitleChange={setWorkshopsSubtitle} onToggle={(id) => toggleSelected(id, workshopsFeaturedIds, setWorkshopsFeaturedIds)} emptyText="No hay workshops publicados." />
        ) : null}

        {tab === "gifts" ? (
          <FeaturedPicker title={giftTitle} subtitle={giftSubtitle} items={giftCards} selectedIds={giftFeaturedIds} onTitleChange={setGiftTitle} onSubtitleChange={setGiftSubtitle} onToggle={(id) => toggleSelected(id, giftFeaturedIds, setGiftFeaturedIds)} emptyText="No hay gift cards publicadas." />
        ) : null}

        {tab === "preview" ? (
          <div className="cms-preview-frame">
            <div className="cms-public-preview__toolbar">Vista previa de escritorio</div>
            <div className="cms-public-preview home-page">
              <div className="cms-public-preview__scale">
                <HomePreviewHeader hero={hero} navigationItems={navigationItems} previewMenu={previewMenu} />
                <main>
                  <IntroSlider slides={introSlides.filter((slide) => slide.isVisible)} />
                  {selectedClasses.length ? <FeaturedSection id="clases-destacadas" title={classesTitle} subtitle={classesSubtitle} items={selectedClasses} variant="classes" /> : null}
                  {selectedWorkshops.length ? <FeaturedSection id="workshops-destacados" title={workshopsTitle} subtitle={workshopsSubtitle} items={selectedWorkshops} variant="workshops" /> : null}
                  {selectedGiftCards.length ? <HomeGiftCardSection title={giftTitle} subtitle={giftSubtitle} items={selectedGiftCards} /> : null}
                </main>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div className="admin-sticky-actionbar">
        <span className="admin-sticky-actionbar__meta">{isDirty ? "Cambios sin guardar" : "Cambios al dia"}</span>
        <button type="button" className="secondary-btn" onClick={() => setTab("preview")}>Vista previa</button>
        <button type="button" className="primary-btn" onClick={() => save("published")} disabled={isLoading}>{isLoading ? "Publicando..." : "Publicar"}</button>
      </div>
    </div>
  );
}

function HomePreviewHeader({
  hero,
  navigationItems,
  previewMenu,
}: {
  hero: CmsHeroSettings;
  navigationItems: NavigationItem[];
  previewMenu: HomeHeroMenuSettings;
}) {
  return (
    <HomeHeroView
      hero={hero}
      navigationItems={navigationItems}
      menu={previewMenu}
    />
  );
}

function FeaturedPicker({
  title,
  subtitle,
  items,
  selectedIds,
  onTitleChange,
  onSubtitleChange,
  onToggle,
  emptyText,
}: {
  title: string;
  subtitle: string;
  items: ExperienceItem[];
  selectedIds: string[];
  onTitleChange: (value: string) => void;
  onSubtitleChange: (value: string) => void;
  onToggle: (id: string) => void;
  emptyText: string;
}) {
  return (
    <section className="form-block cms-editor-card cms-home-editor-card">
      <div className="cms-home-section-settings grid-2">
        <label className="field"><span>Título</span><input value={title} onChange={(event) => onTitleChange(event.target.value)} /></label>
        <label className="field"><span>Subtitulo</span><input value={subtitle} onChange={(event) => onSubtitleChange(event.target.value)} /></label>
      </div>
      <div className="cms-home-feature-grid">
        {items.length ? items.map((item) => (
          <label className={`cms-home-feature-card ${selectedIds.includes(item.id) ? "is-selected" : ""}`} key={item.id}>
            <span className="cms-home-feature-card__image">
              <img src={assetPath(item.homeImage || item.coverImage)} alt={item.homeImageAlt || item.homeTitle || item.title} loading="lazy" decoding="async" />
            </span>
            <span className="cms-home-feature-card__content">
              <span className="cms-home-feature-card__topline">
                <input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => onToggle(item.id)} />
                <span>{selectedIds.includes(item.id) ? "Visible en home" : "Oculto en home"}</span>
              </span>
              <strong>{item.homeTitle || item.title}</strong>
              <small>{item.homeEyebrow || item.category}</small>
              <span className="cms-home-feature-card__excerpt">{item.homeExcerpt || item.excerpt}</span>
            </span>
          </label>
        )) : <p className="muted">{emptyText}</p>}
      </div>
    </section>
  );
}
