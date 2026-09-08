"use client";

import { memo } from "react";
import MediaSelectField from "@/components/admin/MediaSelectField";
import { SectionCard } from "@/components/admin/class-edit/components/SectionCard";
import { SelectField, TextAreaField, TextField } from "@/components/admin/class-edit/fields";
import Switch from "@/components/ui/Switch";
import type { BlogPostStatus } from "@/lib/cms/types";
import { BLOG_POST_CATEGORY_OPTIONS, BLOG_POST_MEDIA_FOLDER } from "../constants";
import type { BlogPostFormState } from "../hooks/useBlogPostForm";
import { clampListingExcerpt, LISTING_EXCERPT_MAX_LENGTH, slugifyBlogPost } from "../utils/slugify";
import { BlogPostIntroRichTextField } from "./BlogPostIntroRichTextField";

function BlogFormStructureSectionComponent({
  form,
  onContinuePreview,
}: {
  form: BlogPostFormState;
  onContinuePreview: () => void;
}) {
  return (
    <div className="space-y-6">
      <SectionCard title="Presentación del artículo" description="Título, extracto, categoría e imagen principal.">
        <p className="auth-kicker -mt-1">Paso 1</p>
        <div className="grid gap-4 md:grid-cols-2">
          <TextField
            label="Título"
            required
            value={form.title}
            onChange={(event) => form.setTitle(event.target.value)}
            onBlur={form.handleTitleBlur}
          />
          <TextField
            label="Slug"
            value={form.slug}
            help="Se genera automáticamente si lo dejas vacío."
            onChange={(event) => form.setSlug(slugifyBlogPost(event.target.value))}
          />
          <div className="md:col-span-2">
            <MediaSelectField
              label="Imagen debajo del título"
              value={form.titleImageId}
              onChange={form.setTitleImageId}
              folder={BLOG_POST_MEDIA_FOLDER}
            />
          </div>
          <div className="md:col-span-2">
            <TextAreaField
              label="Extracto del listado"
              value={form.listingExcerpt}
              maxLength={LISTING_EXCERPT_MAX_LENGTH}
              placeholder="Resumen breve para el listado"
              help={`${form.listingExcerpt.length}/${LISTING_EXCERPT_MAX_LENGTH} caracteres. Si queda vacío, se generará desde el contenido.`}
              onChange={(event) => form.setListingExcerpt(clampListingExcerpt(event.target.value))}
            />
          </div>
          <div className="md:col-span-2">
            <BlogPostIntroRichTextField
              label="Texto introductorio"
              required
              value={form.excerpt}
              typography={form.excerptTypography}
              onChange={form.setExcerpt}
              onTypographyChange={form.setExcerptTypography}
            />
          </div>
          <SelectField
            label="Estado"
            value={form.status}
            onChange={(event) => form.setStatus(event.target.value as BlogPostStatus)}
          >
            <option value="draft">Borrador</option>
            <option value="published">Publicado</option>
            <option value="archived">Archivado</option>
          </SelectField>
          <SelectField label="Tipo" value={form.categoryMode} onChange={(event) => form.setCategoryMode(event.target.value)}>
            {BLOG_POST_CATEGORY_OPTIONS.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
            <option value="custom">Nuevo tipo</option>
          </SelectField>
          {form.categoryMode === "custom" ? (
            <TextField label="Nuevo tipo" value={form.customCategory} onChange={(event) => form.setCustomCategory(event.target.value)} />
          ) : null}
          <TextField
            label="Orden"
            type="number"
            value={form.sortOrder}
            onChange={(event) => form.setSortOrder(Number(event.target.value))}
          />
          <TextField
            label="Tags"
            value={form.tagsInput}
            placeholder="cerámica, proceso, taller"
            className="md:col-span-2"
            onChange={(event) => form.setTagsInput(event.target.value)}
          />
          <div className="md:col-span-2">
            <MediaSelectField
              label="Imagen principal"
              value={form.featuredImageId}
              onChange={form.setFeaturedImageId}
              folder={BLOG_POST_MEDIA_FOLDER}
            />
          </div>
          <div className="md:col-span-2">
            <Switch
              checked={form.visibleInListing}
              label="Visible en listado"
              description="Controla si aparece en el grid principal de /blog."
              onCheckedChange={form.setVisibleInListing}
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Metadatos SEO" description="Título, descripción e imagen para buscadores y redes.">
        <div className="grid gap-4 md:grid-cols-2">
          <TextField
            label="SEO title"
            value={form.seoTitle}
            maxLength={70}
            help={`${form.seoTitle.length}/70 caracteres`}
            className="md:col-span-2"
            onChange={(event) => form.setSeoTitle(event.target.value)}
          />
          <TextAreaField
            label="SEO description"
            value={form.seoDescription}
            maxLength={160}
            help={`${form.seoDescription.length}/160 caracteres`}
            className="md:col-span-2"
            onChange={(event) => form.setSeoDescription(event.target.value)}
          />
          <div className="md:col-span-2">
            <MediaSelectField
              label="SEO image"
              value={form.seoImage}
              onChange={form.setSeoImage}
              folder={BLOG_POST_MEDIA_FOLDER}
            />
          </div>
        </div>
      </SectionCard>

      <div className="sticky-form-actions form-actions">
        <button type="button" className="secondary-btn" onClick={onContinuePreview}>
          Continuar a vista previa
        </button>
      </div>
    </div>
  );
}

export const BlogFormStructureSection = memo(BlogFormStructureSectionComponent);
