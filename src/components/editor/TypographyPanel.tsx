"use client";

import type { Dispatch, SetStateAction } from "react";
import type { TypographyState } from "./editor-types";

function AxisInfo({ title }: { title: string }) {
  return <span className="tiptap-typography-panel__info" title={title} aria-hidden="true">i</span>;
}

export default function TypographyPanel({
  typography,
  onChange,
  variant = "sidebar",
  showLineHeightControl = false,
}: {
  typography: TypographyState;
  onChange: Dispatch<SetStateAction<TypographyState>>;
  variant?: "sidebar" | "inline";
  showLineHeightControl?: boolean;
}) {
  return (
    <aside
      className={`tiptap-typography-panel${variant === "inline" ? " tiptap-typography-panel--inline" : ""}`}
      aria-label="Tipografía del bloque"
    >
      <div className="tiptap-typography-panel__head">
        <span>{variant === "inline" ? "Tipografía del bloque" : "Variable Axes"}</span>
        <button
          type="button"
          aria-label="Restablecer tipografía del bloque"
          onClick={() => onChange({ italic: false, weight: 400, width: 100, fontSize: typography.fontSize, lineHeight: 1.38 })}
        >
          reset
        </button>
      </div>

      <label className="tiptap-typography-panel__toggle">
        <span>
          Cursiva global
          <AxisInfo title="Aplica la variante cursiva a todo el bloque. Para énfasis parcial usa negrita o subrayado en la barra superior." />
        </span>
        <input
          type="checkbox"
          checked={typography.italic}
          onChange={(event) => onChange((current) => ({ ...current, italic: event.target.checked }))}
        />
      </label>

      <label className="tiptap-typography-panel__axis">
        <span>Weight <AxisInfo title="wght: ajusta el peso del trazo, de mas ligero a mas grueso." /></span>
        <output>{typography.weight}</output>
        <input
          type="range"
          min={100}
          max={900}
          step={1}
          value={typography.weight}
          onChange={(event) => onChange((current) => ({ ...current, weight: Number(event.target.value) }))}
        />
      </label>

      <label className="tiptap-typography-panel__axis">
        <span>Width <AxisInfo title="wdth: ajusta las proporciones de la letra, de mas estrecha a mas ancha." /></span>
        <output>{typography.width}</output>
        <input
          type="range"
          min={75}
          max={125}
          step={1}
          value={typography.width}
          onChange={(event) => onChange((current) => ({ ...current, width: Number(event.target.value) }))}
        />
      </label>

      {showLineHeightControl ? (
        <label className="tiptap-typography-panel__axis">
          <span>Interlineado <AxisInfo title="Controla la distancia vertical entre las líneas del título." /></span>
          <output>{(typography.lineHeight ?? 1.38).toFixed(2)}</output>
          <input
            type="range"
            min={0.8}
            max={2}
            step={0.01}
            value={typography.lineHeight ?? 1.38}
            onChange={(event) => onChange((current) => ({ ...current, lineHeight: Number(event.target.value) }))}
          />
        </label>
      ) : null}
    </aside>
  );
}
