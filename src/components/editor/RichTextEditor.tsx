"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import EditorMediaDialog from "./EditorMediaDialog";
import EditorToolbar, { defaultRichTextEditorControls } from "./EditorToolbar";
import TypographyPanel from "./TypographyPanel";
import { editorExtensions } from "./editor-extensions";
import { htmlStringToMarkdown, markdownToHtml } from "./markdown-codec";
import {
  DEFAULT_RICH_TEXT_TYPOGRAPHY,
  normalizeRichTextTypography,
  richTextTypographyCssVars,
} from "@/lib/cms/rich-text-typography";
import type { RichTextEditorProps, TypographyState } from "./editor-types";

export default function RichTextEditor({
  label,
  value,
  onChange,
  minHeight = "190px",
  className,
  controls = defaultRichTextEditorControls,
  name,
  required,
  maxLength,
  placeholder,
  hideLabel = false,
  layout = "default",
  typography: typographyProp,
  onTypographyChange,
  showLineHeightControl = false,
  style,
  ...props
}: RichTextEditorProps) {
  const [mediaKind, setMediaKind] = useState<"image" | "iframe" | null>(null);
  const [internalTypography, setInternalTypography] = useState<TypographyState>(DEFAULT_RICH_TEXT_TYPOGRAPHY);
  const typography = typographyProp ?? internalTypography;
  const setTypography = (next: TypographyState | ((current: TypographyState) => TypographyState)) => {
    const resolved = typeof next === "function" ? next(typography) : next;
    const normalized = normalizeRichTextTypography(resolved);
    if (!typographyProp) setInternalTypography(normalized);
    onTypographyChange?.(normalized);
  };
  const lastMarkdownRef = useRef(value);
  const editorShellRef = useRef<HTMLDivElement | null>(null);
  const descriptionId = `${label.replace(/\s+/g, "-").toLowerCase()}-editor-description`;

  const extensions = useMemo(() => editorExtensions(placeholder), [placeholder]);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const editor = useEditor({
    extensions,
    content: markdownToHtml(value),
    immediatelyRender: false,
    // TipTap v3 defaults this to false; toolbar active state + controlled sync need it.
    shouldRerenderOnTransaction: true,
    editorProps: {
      attributes: {
        class: "tiptap-editor__content",
        style: `min-height: ${minHeight}`,
        "aria-label": label,
        ...(maxLength ? { "aria-describedby": descriptionId } : {}),
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      // Prefer getHTML() so marks (bold/italic/…) serialize from the document, not ProseMirror chrome.
      const nextMarkdown = htmlStringToMarkdown(currentEditor.getHTML());
      lastMarkdownRef.current = nextMarkdown;
      onChangeRef.current(nextMarkdown);
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (value === lastMarkdownRef.current) return;
    const currentMarkdown = htmlStringToMarkdown(editor.getHTML());
    if (currentMarkdown === value) {
      lastMarkdownRef.current = value;
      return;
    }
    lastMarkdownRef.current = value;
    editor.commands.setContent(markdownToHtml(value), { emitUpdate: false });
  }, [editor, value]);

  const plainTextLength = editor?.state.doc.textContent.length ?? 0;
  const overLimit = typeof maxLength === "number" && plainTextLength > maxLength;
  // CSS vars on the shell feed `.tiptap-editor__content`. Do not put fontSize here —
  // it would scale toolbar chrome (width/height of controls).
  const shellStyle = {
    ...richTextTypographyCssVars(typography),
    ...style,
  } as CSSProperties;

  return (
    <div
      {...props}
      style={shellStyle}
      className={`tiptap-editor${layout === "compact" ? " tiptap-editor--compact" : ""} ${className ?? ""}`}
      ref={editorShellRef}
    >
      {!hideLabel || typeof maxLength === "number" ? (
        layout !== "compact" ? (
          <div className="tiptap-editor__label-row">
            {!hideLabel ? (
              <label className="tiptap-editor__label">{label}{required ? " *" : ""}</label>
            ) : null}
            {typeof maxLength === "number" ? (
              <span className={overLimit ? "tiptap-editor__count is-over" : "tiptap-editor__count"} id={descriptionId}>
                {plainTextLength}/{maxLength}
              </span>
            ) : null}
          </div>
        ) : null
      ) : null}
      {editor ? (
        <>
          <div className="tiptap-editor__workspace">
            {layout === "compact" && !hideLabel ? (
              <div className="tiptap-editor__label-row tiptap-editor__label-row--inset">
                <label className="tiptap-editor__label">{label}{required ? " *" : ""}</label>
                {typeof maxLength === "number" ? (
                  <span className={overLimit ? "tiptap-editor__count is-over" : "tiptap-editor__count"} id={descriptionId}>
                    {plainTextLength}/{maxLength}
                  </span>
                ) : null}
              </div>
            ) : null}
            {layout === "compact" ? (
              <details className="tiptap-typography-drawer">
                <summary>Tipografía del bloque</summary>
                <TypographyPanel typography={typography} onChange={setTypography} variant="inline" showLineHeightControl={showLineHeightControl} />
              </details>
            ) : (
              <TypographyPanel typography={typography} onChange={setTypography} showLineHeightControl={showLineHeightControl} />
            )}
            <div className="tiptap-editor__main">
              <EditorToolbar
                editor={editor}
                controls={controls}
                typography={typography}
                onTypographyChange={setTypography}
                onOpenImage={() => setMediaKind("image")}
                onOpenIframe={() => setMediaKind("iframe")}
              />
              <div className={overLimit ? "tiptap-editor__surface is-over" : "tiptap-editor__surface"}>
                <EditorContent editor={editor} />
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="tiptap-editor__loading" style={{ minHeight }}>Cargando editor...</div>
      )}
      {name ? <textarea name={name} value={value} required={required} readOnly hidden /> : null}
      <EditorMediaDialog
        open={Boolean(mediaKind)}
        kind={mediaKind ?? "image"}
        onClose={() => setMediaKind(null)}
        onInsertImage={(src, alt) => editor?.chain().focus().setImage({ src, alt }).run()}
        onInsertIframe={(src) => editor?.chain().focus().setIframe({ src }).run()}
      />
    </div>
  );
}
