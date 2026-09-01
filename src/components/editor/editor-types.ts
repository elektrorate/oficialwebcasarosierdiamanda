import type { HTMLAttributes } from "react";

export type RichTextEditorControl =
  | "undo"
  | "redo"
  | "normal"
  | "paragraph"
  | "h1"
  | "h2"
  | "h3"
  | "bold"
  | "italic"
  | "underline"
  | "strike"
  | "blockquote"
  | "ul"
  | "ol"
  | "alignLeft"
  | "alignCenter"
  | "alignRight"
  | "alignJustify"
  | "link"
  | "image"
  | "iframe";

export interface RichTextEditorProps extends Omit<HTMLAttributes<HTMLDivElement>, "onChange" | "value"> {
  label: string;
  value: string;
  onChange: (value: string) => void;
  minHeight?: string;
  controls?: RichTextEditorControl[];
  name?: string;
  required?: boolean;
  maxLength?: number;
  placeholder?: string;
  hideLabel?: boolean;
  layout?: "default" | "compact";
  typography?: TypographyState;
  onTypographyChange?: (typography: TypographyState) => void;
  showLineHeightControl?: boolean;
}

export type MediaSourceMode = "library" | "upload" | "url";

export interface TypographyState {
  italic: boolean;
  weight: number;
  width: number;
  fontSize: number;
  lineHeight?: number;
}
