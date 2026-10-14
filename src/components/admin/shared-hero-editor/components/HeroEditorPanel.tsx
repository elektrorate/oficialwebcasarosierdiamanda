"use client";

import Button from "@/components/ui/Button";
import { SectionCard } from "@/components/admin/class-edit/components/SectionCard";
import type { CmsHeroSettings } from "@/lib/cms/types";
import { HERO_EDITOR_SECTIONS } from "../constants";
import { useHeroEditorSections } from "../hooks/useHeroEditorSections";
import type { SharedHeroEditorState } from "../types";
import { HeroContentFields } from "./HeroContentFields";
import { HeroPositionSection } from "./HeroPositionSection";
import { HeroPreviewPanel } from "./HeroPreviewPanel";
import { HeroSectionNav } from "./HeroSectionNav";
import { HeroVariantPicker } from "./HeroVariantPicker";

type HeroEditorPanelProps = {
  details: CmsHeroSettings;
  previewHero: CmsHeroSettings;
  titleFallback: string;
  subtitleFallback?: string;
  allowImageTextOverlay?: boolean;
  editor: SharedHeroEditorState;
  onChange: (next: Partial<CmsHeroSettings>) => void;
};

export function HeroEditorPanel({
  details,
  previewHero,
  titleFallback,
  subtitleFallback,
  allowImageTextOverlay = false,
  editor,
  onChange,
}: HeroEditorPanelProps) {
  const sections = useHeroEditorSections();
  const current = HERO_EDITOR_SECTIONS[sections.sectionIndex];

  return (
    <div className="class-edit-hero-layout">
      <div className="class-edit-hero-workspace">
        <aside className="class-edit-hero-sidebar">
          <HeroSectionNav activeSection={sections.activeSection} onSectionChange={sections.setActiveSection} />
        </aside>

        <div className="class-edit-hero-main">
          <header className="class-edit-hero-main__head">
            <p className="class-edit-hero-main__kicker">
              Sección {sections.sectionIndex + 1} de {HERO_EDITOR_SECTIONS.length}
            </p>
            <h2 className="class-edit-hero-main__title">{current.label}</h2>
            <p className="class-edit-hero-main__description">{current.description}</p>
          </header>

          <div className="class-edit-hero-main__panel" key={sections.activeSection}>
            {sections.activeSection === "variant" ? (
              <SectionCard compact title="Elige el tipo de hero" description="Cada variante expone campos distintos en las secciones de contenido y posición.">
                <HeroVariantPicker details={details} editor={editor} />
              </SectionCard>
            ) : null}

            {sections.activeSection === "content" ? (
              <SectionCard compact title="Contenido del hero" description="Textos, imágenes de fondo, superpuestas o de presentación según la variante activa.">
                <HeroContentFields
                  details={details}
                  titleFallback={titleFallback}
                  subtitleFallback={subtitleFallback}
                  allowImageTextOverlay={allowImageTextOverlay}
                  editor={editor}
                  onChange={onChange}
                />
              </SectionCard>
            ) : null}

            {sections.activeSection === "position" ? (
              <HeroPositionSection
                details={details}
                editor={editor}
                allowImageTextOverlay={allowImageTextOverlay}
                onChange={onChange}
              />
            ) : null}
          </div>

          <footer className="class-edit-hero-main__footer">
            <Button type="button" variant="ghost" size="sm" disabled={!sections.hasPrevious} onClick={sections.goToPrevious}>
              ← Anterior
            </Button>
            <span className="class-edit-hero-main__progress" aria-live="polite">
              {current.label}
            </span>
            <Button type="button" variant="outlined" size="sm" disabled={!sections.hasNext} onClick={sections.goToNext}>
              Siguiente →
            </Button>
          </footer>
        </div>
      </div>

      <aside className="class-edit-hero-preview" aria-label="Vista previa del hero">
        <HeroPreviewPanel
          details={details}
          previewHero={previewHero}
          editor={editor}
          allowImageTextOverlay={allowImageTextOverlay}
        />
      </aside>
    </div>
  );
}
