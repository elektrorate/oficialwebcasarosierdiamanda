"use client";

import { memo } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { ImagePreview, TextAreaField, TextField } from "../fields";
import type { ClassEditFormState } from "../hooks/useClassEditForm";
import { useSeoTabHandlers } from "../hooks/useSeoTabHandlers";

function ClassEditSeoTabComponent({ form }: { form: ClassEditFormState }) {
  const {
    seoTitle,
    seoDescription,
    seoImage,
    seoTitleHelp,
    seoDescriptionHelp,
    handleSeoTitleChange,
    handleSeoDescriptionChange,
    openSeoImagePicker,
    serpPreview,
  } = useSeoTabHandlers(form);

  return (
    <>
      <Card padding="lg" className="space-y-5 rounded-2xl">
        <h2 className="text-headline-sm text-on-surface">SEO</h2>
        <TextField
          label="Título SEO"
          value={seoTitle}
          help={seoTitleHelp}
          onChange={(event) => handleSeoTitleChange(event.target.value)}
        />
        <TextAreaField
          label="Descripción SEO"
          value={seoDescription}
          help={seoDescriptionHelp}
          onChange={(event) => handleSeoDescriptionChange(event.target.value)}
          className="min-h-[100px]"
        />
      </Card>
      <Card padding="lg" className="space-y-5 rounded-2xl">
        <h2 className="text-headline-sm text-on-surface">Open Graph</h2>
        <ImagePreview src={seoImage} alt="Imagen SEO" />
        <Button type="button" variant="outlined" size="sm" onClick={openSeoImagePicker}>
          {seoImage ? "Reemplazar imagen" : "Establecer imagen SEO"}
        </Button>
        <div className="overflow-hidden rounded-xl border border-outline-variant bg-white p-4">
          <p className="truncate text-sm text-[#1a0dab]">{serpPreview.title}</p>
          <p className="truncate text-sm text-[#006d21]">{serpPreview.url}</p>
          <p className="mt-1 line-clamp-2 text-sm text-[#545454]">{serpPreview.description}</p>
        </div>
      </Card>
    </>
  );
}

export const ClassEditSeoTab = memo(ClassEditSeoTabComponent);
