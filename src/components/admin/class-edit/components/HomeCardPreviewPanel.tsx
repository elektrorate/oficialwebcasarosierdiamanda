"use client";

import { FeaturedExperienceCards } from "@/components/home/FeaturedExperienceCards";
import { GiftCarousel } from "@/components/home/GiftCarousel";
import type { Offering } from "@/lib/cms/types";
import type { ClassEditFormState } from "../hooks/useClassEditForm";
import { buildPreviewItem } from "../utils";
import { SectionCard } from "./SectionCard";

type HomeCardPreviewPanelProps = {
  offering: Offering;
  form: ClassEditFormState;
};

export function HomeCardPreviewPanel({ offering, form }: HomeCardPreviewPanelProps) {
  const { title, slug, subtitle, description, seoTitle, seoDescription, details } = form;
  const previewItem = buildPreviewItem({
    offeringType: offering.type,
    title,
    slug,
    subtitle,
    description,
    seoTitle,
    seoDescription,
    details,
  });
  const featuredVariant = previewItem.kind === "workshop" ? "workshops" : "classes";

  return (
    <SectionCard
      compact
      title="Vista previa"
      description="Misma estructura visual que se mostrará si seleccionas este contenido desde Inicio → destacados."
      className="class-edit-home-preview-card"
    >
      <section className={`class-edit-home-public-preview featured featured--${featuredVariant}`}>
        <div className="featured__container">
          {previewItem.kind === "gift-card" ? (
            <GiftCarousel items={[previewItem]} />
          ) : (
            <div className="featured__grid cards-grid">
              <FeaturedExperienceCards items={[previewItem]} />
            </div>
          )}
        </div>
      </section>
    </SectionCard>
  );
}
