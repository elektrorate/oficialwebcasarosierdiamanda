"use client";

import RichTextEditor from "@/components/editor/RichTextEditor";
import type { RichTextEditorControl } from "@/components/editor/editor-types";
import {
  DEFAULT_RICH_TEXT_TYPOGRAPHY,
  normalizeRichTextTypography,
  type RichTextTypography,
} from "@/lib/cms/rich-text-typography";
import { FormField } from "./FormField";

export function AdminRichTextField({
  label,
  value,
  onChange,
  typography,
  onTypographyChange,
  minHeight = "190px",
  placeholder,
  required,
  maxLength,
  controls,
  error,
  help,
  validationKey,
  layout = "default",
  labelPlacement = "field",
  showLineHeightControl = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  typography?: RichTextTypography;
  onTypographyChange?: (typography: RichTextTypography) => void;
  minHeight?: string;
  placeholder?: string;
  required?: boolean;
  maxLength?: number;
  controls?: RichTextEditorControl[];
  error?: string;
  help?: string;
  validationKey?: string;
  layout?: "default" | "compact";
  labelPlacement?: "field" | "editor";
  showLineHeightControl?: boolean;
}) {
  const resolvedTypography = normalizeRichTextTypography(typography ?? DEFAULT_RICH_TEXT_TYPOGRAPHY);
  const showLabelInField = labelPlacement !== "editor";

  return (
    <FormField
      label={showLabelInField ? label : undefined}
      required={required}
      help={help}
      error={error}
      validationKey={validationKey}
    >
      <RichTextEditor
        label={label}
        hideLabel={showLabelInField}
        layout={layout}
        value={value}
        onChange={onChange}
        minHeight={minHeight}
        placeholder={placeholder}
        required={required}
        maxLength={maxLength}
        controls={controls}
        typography={resolvedTypography}
        onTypographyChange={onTypographyChange}
        showLineHeightControl={showLineHeightControl}
      />
    </FormField>
  );
}
