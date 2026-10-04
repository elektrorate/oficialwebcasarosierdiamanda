"use client";

import { memo, useCallback, useMemo, useState } from "react";
import { DetailPage } from "@/components/collections/DetailPage";
import { PublicFooterContent } from "@/components/layout/PublicFooterContent";
import { ClassDetailSection } from "@/features/classes/components/class-detail/ClassDetailSection";
import type { ClassEditorPreviewChrome } from "@/lib/cms/class-editor-preview";
import type { ClassOfferingDetails } from "@/lib/cms/types";
import type { ExperienceItem } from "@/data/types";
import { PREVIEW_DEVICES } from "../constants";
import type { PreviewDevice } from "../types";
import { PreviewHeader } from "./PreviewHeader";
import { PreviewSerpSnippet } from "./PreviewSerpSnippet";
import { PublicSocialGalleryPreview } from "./PublicSocialGalleryPreview";

function editorialPromoPage(kind: ExperienceItem["kind"]) {
  if (kind === "class") return "class";
  if (kind === "workshop") return "workshop";
  if (kind === "private-booking") return "experience";
  if (kind === "gift-card") return "gift-card";
  return "class";
}

function usesEditorialDetail(kind: ExperienceItem["kind"]) {
  return (
    kind === "class" ||
    kind === "workshop" ||
    kind === "private-booking" ||
    kind === "gift-card"
  );
}

function PreviewPaneComponent({
  previewItem,
  status,
  details,
  previewChrome,
  seoTitle,
  seoDescription,
  title,
  slug,
}: {
  previewItem: ExperienceItem;
  status: "draft" | "published";
  details: ClassOfferingDetails;
  previewChrome: ClassEditorPreviewChrome;
  seoTitle: string;
  seoDescription: string;
  title: string;
  slug: string;
  description: string;
}) {
  const [previewDevice, setPreviewDevice] = useState<PreviewDevice>("desktop");

  const activePreviewDevice = useMemo(
    () => PREVIEW_DEVICES.find((device) => device.key === previewDevice) ?? PREVIEW_DEVICES[2],
    [previewDevice],
  );

  const promoPage = useMemo(() => editorialPromoPage(previewItem.kind), [previewItem.kind]);
  const editorial = usesEditorialDetail(previewItem.kind);

  const handleDeviceChange = useCallback((device: PreviewDevice) => {
    setPreviewDevice(device);
  }, []);

  const viewportStyle = useMemo(
    () => ({ width: `${activePreviewDevice.width}px`, maxWidth: "100%" }),
    [activePreviewDevice.width],
  );

  const showSocialGallery = previewItem.showIdeaPromptSection === true;

  return (
    <div className="cms-preview-frame space-y-4">
      <PreviewSerpSnippet
        seoTitle={seoTitle}
        seoDescription={seoDescription}
        title={title}
        slug={slug}
        description={details.highlightDescription}
      />

      <div className="cms-public-preview__toolbar">
        <span>Vista previa · {status === "published" ? "Publicado" : "Borrador"}</span>
        <div className="cms-public-preview__devices" role="tablist" aria-label="Dispositivo de vista previa">
          {PREVIEW_DEVICES.map((device) => (
            <button
              key={device.key}
              type="button"
              role="tab"
              aria-selected={previewDevice === device.key}
              className={previewDevice === device.key ? "is-active" : ""}
              onClick={() => handleDeviceChange(device.key)}
            >
              {device.label}
            </button>
          ))}
        </div>
      </div>

      <div className="cms-public-preview__viewport">
        <div
          className={`cms-public-preview class-detail-page cms-public-preview--${previewDevice}`}
          data-promo-page={promoPage}
          style={viewportStyle}
        >
          <div className="cms-public-preview__scale">
            <PreviewHeader
              item={previewItem}
              details={details}
              previewChrome={previewChrome}
              previewDevice={previewDevice}
            />
            <div className="cms-public-preview__body">
              {editorial ? (
                <ClassDetailSection
                  item={previewItem}
                  titleLevel={previewItem.heroVariant === "text" ? "h2" : "h1"}
                />
              ) : (
                <DetailPage
                  item={previewItem}
                  titleLevel={previewItem.heroVariant === "text" ? "h2" : "h1"}
                />
              )}
              {showSocialGallery ? <PublicSocialGalleryPreview previewChrome={previewChrome} /> : null}
            </div>
            <PublicFooterContent
              footer={previewChrome.footer}
              contactForm={previewChrome.footerContactForm}
              siteContact={previewChrome.siteContact}
              preview
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export const PreviewPane = memo(PreviewPaneComponent);
