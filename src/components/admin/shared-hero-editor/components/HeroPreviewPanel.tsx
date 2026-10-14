"use client";

import { memo } from "react";
import { SectionCard } from "@/components/admin/class-edit/components/SectionCard";
import type { CmsHeroSettings } from "@/lib/cms/types";
import type { SharedHeroEditorState } from "../types";
import { HeroDeviceTabs } from "./HeroDeviceTabs";
import { HeroPositionPreview } from "./HeroPositionPreview";

type HeroPreviewPanelProps = {
  details: CmsHeroSettings;
  previewHero: CmsHeroSettings;
  editor: SharedHeroEditorState;
  allowImageTextOverlay?: boolean;
};

function HeroPreviewPanelComponent({
  details,
  previewHero,
  editor,
  allowImageTextOverlay = false,
}: HeroPreviewPanelProps) {
  return (
    <SectionCard
      compact
      title="Vista previa"
      description="Vista previa a ancho completo. Cambia dispositivo para comprobar posiciones y composición del hero."
      className="class-edit-hero-preview-card"
      action={<HeroDeviceTabs editor={editor} />}
    >
      <HeroPositionPreview details={details} previewHero={previewHero} editor={editor} allowImageTextOverlay={allowImageTextOverlay} />
    </SectionCard>
  );
}

export const HeroPreviewPanel = memo(HeroPreviewPanelComponent);
