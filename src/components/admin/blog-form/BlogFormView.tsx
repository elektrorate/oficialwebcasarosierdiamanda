"use client";

import { memo } from "react";
import AdminActionModal from "@/components/admin/AdminActionModal";
import type { NavigationItem } from "@/data/types";
import type { SiteSettings } from "@/lib/cms/settings";
import { BlogFormHeader } from "./components/BlogFormHeader";
import { BlogFormHeroSection } from "./components/BlogFormHeroSection";
import { BlogFormStickyBar } from "./components/BlogFormStickyBar";
import { BlogFormStructureSection } from "./components/BlogFormStructureSection";
import { BlogFormTabBar } from "./components/BlogFormTabBar";
import { BlogPostFormPreview } from "./components/BlogPostFormPreview";
import { useBlogPostForm, type UseBlogPostFormProps } from "./hooks/useBlogPostForm";

export type BlogFormViewProps = UseBlogPostFormProps & {
  navigationItems: NavigationItem[];
  menuSettings: SiteSettings["menu"];
};

function BlogFormViewComponent({ navigationItems, menuSettings, ...formProps }: BlogFormViewProps) {
  const form = useBlogPostForm(formProps);

  return (
    <div className="cms-editor-shell">
      <AdminActionModal
        open={Boolean(form.modal)}
        type={form.modal?.type}
        title={form.modal?.title ?? ""}
        message={form.modal?.message}
        confirmLabel="Entendido"
        onClose={form.closeModal}
      />

      <BlogFormHeader
        editorTitle={form.editorTitle}
        status={form.status}
        readingTime={form.readingTime}
        visibleBlockCount={form.visibleBlockCount}
        syncStatus={form.syncStatus}
        syncError={form.syncError}
        isSaving={form.isSaving}
        onSaveDraft={form.saveDraft}
        onSavePublished={form.savePublished}
      />

      <BlogFormTabBar activeTab={form.tab} onTabChange={form.setTab} />

      <div className="cms-editor-main">
        <div className={form.tab === "hero" ? undefined : "hidden"} aria-hidden={form.tab !== "hero"}>
          <BlogFormHeroSection
            hero={form.hero}
            title={form.title}
            categorySubtitle={form.categorySubtitle}
            patchHero={form.patchHero}
          />
        </div>
        <div className={form.tab === "structure" ? undefined : "hidden"} aria-hidden={form.tab !== "structure"}>
          <BlogFormStructureSection form={form} onContinuePreview={form.openPreviewTab} />
        </div>
        <div className={form.tab === "preview" ? undefined : "hidden"} aria-hidden={form.tab !== "preview"}>
          <BlogPostFormPreview
            title={form.title}
            excerpt={form.excerpt}
            featuredImageId={form.featuredImageId}
            blocks={form.blocks}
            previewHero={form.previewHero}
            currentCategory={form.currentCategory}
            slug={form.slug}
            status={form.status}
            isFeatured={form.isFeatured}
            featuredOrder={form.featuredOrder}
            featuredExcerpt={form.featuredExcerpt}
            visibleInListing={form.visibleInListing}
            sortOrder={form.sortOrder}
            seoTitle={form.seoTitle}
            seoDescription={form.seoDescription}
            previewPublishedAt={form.previewPublishedAt}
            navigationItems={navigationItems}
            menuSettings={menuSettings}
            syncStatus={form.syncStatus}
          />
        </div>
      </div>

      <BlogFormStickyBar
        readingTime={form.readingTime}
        visibleBlockCount={form.visibleBlockCount}
        syncStatus={form.syncStatus}
        isSaving={form.isSaving}
        onPreview={form.openPreviewTab}
        onSaveDraft={form.saveDraft}
        onSavePublished={form.savePublished}
      />
    </div>
  );
}

export const BlogFormView = memo(BlogFormViewComponent);
