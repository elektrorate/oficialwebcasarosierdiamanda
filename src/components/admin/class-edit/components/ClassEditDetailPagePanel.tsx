"use client";

import Button from "@/components/ui/Button";
import ClassContentTab from "@/components/admin/ClassContentTab";
import type { Offering } from "@/lib/cms/types";
import { DETAIL_PAGE_SECTIONS } from "../constants";
import { useDetailPageSections } from "../hooks/useDetailPageSections";
import type { ClassEditFormState } from "../hooks/useClassEditForm";
import { BasicInfoSection } from "./BasicInfoSection";
import { CalendarLabelsSection } from "./CalendarLabelsSection";
import { CtaButtonsSection } from "./CtaButtonsSection";
import { DetailMediaSection } from "./DetailMediaSection";
import { DetailPageSectionNav } from "./DetailPageSectionNav";
import { GalleryImagesSection } from "./GalleryImagesSection";
import { PricingSection } from "./PricingSection";
import { ScheduleSection } from "./ScheduleSection";

type ClassEditDetailPagePanelProps = {
  offering: Offering;
  form: ClassEditFormState;
};

export function ClassEditDetailPagePanel({ offering, form }: ClassEditDetailPagePanelProps) {
  const { details, handleContentChange } = form;
  const sections = useDetailPageSections(form);
  const current = DETAIL_PAGE_SECTIONS[sections.sectionIndex];

  return (
    <div className="class-edit-detail-layout">
      <aside className="class-edit-detail-sidebar">
        <DetailPageSectionNav
          activeSection={sections.activeSection}
          sectionsWithErrors={sections.sectionsWithErrors}
          onSectionChange={sections.setActiveSection}
        />
      </aside>

      <div className="class-edit-detail-main">
        <header className="class-edit-detail-main__head">
          <div>
            <p className="class-edit-detail-main__kicker">
              Sección {sections.sectionIndex + 1} de {DETAIL_PAGE_SECTIONS.length}
            </p>
            <h2 className="class-edit-detail-main__title">{current.label}</h2>
            <p className="class-edit-detail-main__description">{current.description}</p>
          </div>
        </header>

        <div className="class-edit-detail-main__panel" key={sections.activeSection}>
          {sections.activeSection === "basic-info" ? (
            <BasicInfoSection form={form} />
          ) : null}
          {sections.activeSection === "cta" ? (
            <CtaButtonsSection offering={{ type: offering.type }} form={form} />
          ) : null}
          {sections.activeSection === "pricing" ? (
            <PricingSection form={form} />
          ) : null}
          {sections.activeSection === "schedule" ? (
            <ScheduleSection form={form} />
          ) : null}
          {sections.activeSection === "calendar" ? (
            <CalendarLabelsSection form={form} />
          ) : null}
          {sections.activeSection === "media" ? (
            <DetailMediaSection form={form} />
          ) : null}
          {sections.activeSection === "gallery" ? (
            <GalleryImagesSection form={form} />
          ) : null}
          {sections.activeSection === "content" ? (
            <ClassContentTab
              content={details.content}
              onChange={handleContentChange}
              onDirty={form.markDirty}
            />
          ) : null}
        </div>

        <footer className="class-edit-detail-main__footer">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={!sections.hasPrevious}
            onClick={sections.goToPrevious}
          >
            ← Anterior
          </Button>
          <span className="class-edit-detail-main__progress" aria-live="polite">
            {current.label}
          </span>
          <Button
            type="button"
            variant="outlined"
            size="sm"
            disabled={!sections.hasNext}
            onClick={sections.goToNext}
          >
            Siguiente →
          </Button>
        </footer>
      </div>
    </div>
  );
}
