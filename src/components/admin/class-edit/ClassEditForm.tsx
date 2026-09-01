"use client";

import { useCallback, useMemo } from "react";
import AdminActionModal from "@/components/admin/AdminActionModal";
import MediaLibraryModal from "@/components/admin/MediaLibraryModal";
import SharedHeroEditor from "@/components/admin/SharedHeroEditor";
import Button from "@/components/ui/Button";
import type { ClassEditorPreviewChrome } from "@/lib/cms/class-editor-preview";
import type { ClassOfferingDetails, Offering } from "@/lib/cms/types";
import { ClassEditStickyBar } from "./ClassEditStickyBar";
import { CLASS_EDIT_TABS, FALLBACK_PREVIEW_CHROME, FORM_ID } from "./constants";
import { useClassEditForm } from "./hooks/useClassEditForm";
import { ClassEditAdditionsTab } from "./tabs/ClassEditAdditionsTab";
import { ClassEditDetailPagePanel } from "./components/ClassEditDetailPagePanel";
import { ClassEditHomeTab } from "./tabs/ClassEditHomeTab";
import { ClassEditPreviewTab } from "./tabs/ClassEditPreviewTab";
import { ClassEditSeoTab } from "./tabs/ClassEditSeoTab";
import { ClassEditTabBar } from "./tabs/ClassEditTabBar";
import type { ClassEditFormMode } from "./types";

export default function ClassEditForm({
  offering,
  mode = "edit",
  basePath = "/admin/clases",
  previewChrome = FALLBACK_PREVIEW_CHROME,
}: {
  offering: Offering;
  mode?: ClassEditFormMode;
  basePath?: string;
  previewChrome?: ClassEditorPreviewChrome;
}) {
  const form = useClassEditForm({ offering, mode, basePath });
  const { activeTab, updateDetails, title, subtitle } = form;

  const visibleTabs = useMemo(
    () => (offering.type === "experience" ? CLASS_EDIT_TABS.filter((tab) => tab.key !== "home") : CLASS_EDIT_TABS),
    [offering.type],
  );

  const handleHeroDetailsChange = useCallback(
    (next: Partial<ClassOfferingDetails>) => updateDetails(next),
    [updateDetails],
  );

  return (
    <>
      <AdminActionModal
        open={Boolean(form.toast)}
        type={form.toast?.type}
        title={form.toast?.type === "success" ? "Acción completada" : "Revisa la edición"}
        message={form.toast?.message}
        details={form.toast?.details}
        confirmLabel="Entendido"
        onClose={form.closeToast}
      />

      <ClassEditTabBar tabs={visibleTabs} activeTab={activeTab} onTabChange={form.setActiveTab} />

      <form id={FORM_ID} onSubmit={form.handleSubmit} className="class-edit-form space-y-6">
        {activeTab === "hero" ? (
          <SharedHeroEditor
            details={form.details}
            titleFallback={title || "Título del hero"}
            subtitleFallback={subtitle || "Clases - Iniciación"}
            onChange={handleHeroDetailsChange}
          />
        ) : null}

        {activeTab === "home" ? <ClassEditHomeTab offering={offering} form={form} /> : null}
        {activeTab === "basic" ? (
          <ClassEditDetailPagePanel offering={offering} form={form} />
        ) : null}
        {activeTab === "seo" ? <ClassEditSeoTab form={form} /> : null}
        {activeTab === "additions" ? <ClassEditAdditionsTab form={form} previewChrome={previewChrome} /> : null}
        {activeTab === "preview" ? (
          <ClassEditPreviewTab offering={offering} form={form} previewChrome={previewChrome} />
        ) : null}

        <div className="border-t border-outline-variant pt-5">
          <Button type="button" variant="ghost" onClick={form.handleCancel}>Cancelar</Button>
        </div>

        <ClassEditStickyBar form={form} />
      </form>

      <MediaLibraryModal
        open={form.pickerTarget !== null}
        onSelect={form.handleSelectImage}
        onClose={() => form.setPickerTarget(null)}
      />
    </>
  );
}
