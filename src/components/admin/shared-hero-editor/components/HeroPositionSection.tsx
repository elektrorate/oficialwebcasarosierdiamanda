"use client";

import { useId } from "react";
import { AdminInput } from "@/components/ui/AdminField";
import { FormField } from "@/components/ui/FormField";
import ColorPickerField from "@/components/admin/ColorPickerField";
import { SectionCard } from "@/components/admin/class-edit/components/SectionCard";
import type { CmsHeroSettings } from "@/lib/cms/types";
import type { SharedHeroEditorState } from "../types";
import { heroScale, heroText, patchDeviceField } from "../utils";
import { ScaleField } from "./ScaleField";

function HeroLogoMenuFields({
  details,
  editor,
  onChange,
}: {
  details: CmsHeroSettings;
  editor: SharedHeroEditorState;
  onChange: (next: Partial<CmsHeroSettings>) => void;
}) {
  const menuScaleId = useId();
  const { keys, device, navColor } = editor;

  return (
    <>
      <fieldset className="cms-hero-position-fieldset">
        <legend>Propiedades del logo</legend>
        <div className="cms-hero-position-fields cms-hero-position-fields--logo">
          <AdminInput label="Logo X" value={heroText(details, keys.logoX)} onChange={(event) => onChange(patchDeviceField(keys.logoX, event.target.value))} />
          <AdminInput label="Logo Y" value={heroText(details, keys.logoY)} onChange={(event) => onChange(patchDeviceField(keys.logoY, event.target.value))} />
          <AdminInput label="Tamaño logo" value={heroText(details, keys.logoWidth)} onChange={(event) => onChange(patchDeviceField(keys.logoWidth, event.target.value))} />
        </div>
      </fieldset>

      <fieldset className="cms-hero-position-fieldset">
        <legend>Propiedades del menú</legend>
        <div className="cms-hero-position-fields cms-hero-position-fields--menu">
          <ColorPickerField
            label="Color del menú y logo"
            value={navColor}
            help="Aplica al logo, texto, iconos y separadores del menú del hero."
            onChange={editor.updateMenuColor}
          />
          <AdminInput
            label="Menú inicial Y"
            value={heroText(details, keys.menuY)}
            help="También define cuándo aparece la barra secundaria en este dispositivo."
            onChange={(event) => onChange(patchDeviceField(keys.menuY, event.target.value))}
          />
          {device === "desktop" ? (
            <FormField label="Escala del menú en computadora" htmlFor={menuScaleId} help="Esta escala solo se aplica al menú expandido de escritorio.">
              <div className="cms-hero-menu-scale">
                <div className="cms-hero-menu-scale__head">
                  <span>{(details.heroMenuScale ?? 1).toFixed(2)}x</span>
                </div>
                <input
                  id={menuScaleId}
                  type="range"
                  min="0.75"
                  max="1.4"
                  step="0.01"
                  value={details.heroMenuScale ?? 1}
                  aria-valuetext={`${(details.heroMenuScale ?? 1).toFixed(2)}x`}
                  onChange={(event) => onChange({ heroMenuScale: Number(event.target.value) })}
                />
              </div>
            </FormField>
          ) : (
            <p className="cms-hero-mobile-menu-note">
              En tablet y teléfono el hero usa logo a la izquierda y menú de hamburguesa a la derecha; la escala no aplica para estos dispositivos.
            </p>
          )}
        </div>
      </fieldset>
    </>
  );
}

function HeroOverlayPositionFields({
  details,
  editor,
  onChange,
}: {
  details: CmsHeroSettings;
  editor: SharedHeroEditorState;
  onChange: (next: Partial<CmsHeroSettings>) => void;
}) {
  const { keys } = editor;

  return (
    <div className="cms-hero-position-grid">
      <div className="cms-hero-overlay-position__head">
        <h4>Imágenes superpuestas</h4>
        <p>Ajusta X, Y y la escala de cada imagen en el dispositivo seleccionado en la vista previa.</p>
      </div>
      <fieldset className="cms-hero-position-fieldset">
        <legend>Imagen superpuesta 1</legend>
        <div className="cms-hero-position-fields">
          <AdminInput label="Posición X" value={heroText(details, keys.titlePosX)} onChange={(event) => onChange(patchDeviceField(keys.titlePosX, event.target.value))} />
          <AdminInput label="Posición Y" value={heroText(details, keys.titlePosY)} onChange={(event) => onChange(patchDeviceField(keys.titlePosY, event.target.value))} />
          <ScaleField label="Escala" value={heroScale(details, keys.titleScale)} onChange={(value) => onChange(patchDeviceField(keys.titleScale, value))} />
        </div>
      </fieldset>
      <fieldset className="cms-hero-position-fieldset">
        <legend>Imagen superpuesta 2</legend>
        <div className="cms-hero-position-fields">
          <AdminInput label="Posición X" value={heroText(details, keys.titleSecondaryPosX)} onChange={(event) => onChange(patchDeviceField(keys.titleSecondaryPosX, event.target.value))} />
          <AdminInput label="Posición Y" value={heroText(details, keys.titleSecondaryPosY)} onChange={(event) => onChange(patchDeviceField(keys.titleSecondaryPosY, event.target.value))} />
          <ScaleField label="Escala" value={heroScale(details, keys.titleSecondaryScale)} onChange={(value) => onChange(patchDeviceField(keys.titleSecondaryScale, value))} />
        </div>
      </fieldset>
    </div>
  );
}

function HeroMediaPositionFields({
  details,
  editor,
  onChange,
}: {
  details: CmsHeroSettings;
  editor: SharedHeroEditorState;
  onChange: (next: Partial<CmsHeroSettings>) => void;
}) {
  const { keys, device } = editor;
  const deviceLabel = device === "desktop" ? "escritorio" : device === "tablet" ? "tablet" : "móvil";

  return (
    <div className="cms-hero-position-grid">
      <fieldset className="cms-hero-position-fieldset">
        <legend>Encuadre del fondo en {deviceLabel}</legend>
        <div className="cms-hero-position-fields">
          <AdminInput
            label="Posición X"
            value={heroText(details, keys.mediaX)}
            help="Usa porcentajes, por ejemplo 50%."
            onChange={(event) => onChange(patchDeviceField(keys.mediaX, event.target.value))}
          />
          <AdminInput
            label="Posición Y"
            value={heroText(details, keys.mediaY)}
            help="Usa porcentajes, por ejemplo 50%."
            onChange={(event) => onChange(patchDeviceField(keys.mediaY, event.target.value))}
          />
          <ScaleField
            label="Escala del vídeo o imagen"
            value={heroScale(details, keys.mediaScale)}
            onChange={(value) => onChange(patchDeviceField(keys.mediaScale, value))}
          />
        </div>
      </fieldset>
    </div>
  );
}

function HeroTextPositionFields({
  details,
  editor,
  onChange,
}: {
  details: CmsHeroSettings;
  editor: SharedHeroEditorState;
  onChange: (next: Partial<CmsHeroSettings>) => void;
}) {
  const { keys } = editor;

  return (
    <div className="cms-hero-position-grid">
      <fieldset className="cms-hero-position-fieldset">
        <legend>Título tipográfico</legend>
        <div className="cms-hero-position-fields">
          <AdminInput label="Posición X" value={heroText(details, keys.heroTitleX)} onChange={(event) => onChange(patchDeviceField(keys.heroTitleX, event.target.value))} />
          <AdminInput label="Posición Y" value={heroText(details, keys.heroTitleY)} onChange={(event) => onChange(patchDeviceField(keys.heroTitleY, event.target.value))} />
          <ScaleField label="Escala del título y subtítulo" value={heroScale(details, keys.heroTitleScale)} onChange={(value) => onChange(patchDeviceField(keys.heroTitleScale, value))} />
        </div>
      </fieldset>
    </div>
  );
}

function HeroPresentationPositionFields({
  details,
  editor,
  onChange,
}: {
  details: CmsHeroSettings;
  editor: SharedHeroEditorState;
  onChange: (next: Partial<CmsHeroSettings>) => void;
}) {
  const { keys } = editor;

  return (
    <div className="cms-hero-position-grid">
      <div className="cms-hero-overlay-position__head">
        <h4>Presentación</h4>
        <p>Posición del texto principal y la imagen lateral en el dispositivo activo.</p>
      </div>
      <fieldset className="cms-hero-position-fieldset">
        <legend>Texto de presentación (izquierda)</legend>
        <div className="cms-hero-position-fields">
          <AdminInput label="Posición X" value={heroText(details, keys.presentationTextX)} onChange={(event) => onChange(patchDeviceField(keys.presentationTextX, event.target.value))} />
          <AdminInput label="Posición Y" value={heroText(details, keys.presentationTextY)} onChange={(event) => onChange(patchDeviceField(keys.presentationTextY, event.target.value))} />
          <ScaleField label="Escala" value={heroScale(details, keys.presentationTextScale)} onChange={(value) => onChange(patchDeviceField(keys.presentationTextScale, value))} />
        </div>
      </fieldset>
      <fieldset className="cms-hero-position-fieldset">
        <legend>Imagen lateral (derecha)</legend>
        <div className="cms-hero-position-fields">
          <AdminInput label="Posición X" value={heroText(details, keys.presentationImageX)} onChange={(event) => onChange(patchDeviceField(keys.presentationImageX, event.target.value))} />
          <AdminInput label="Posición Y" value={heroText(details, keys.presentationImageY)} onChange={(event) => onChange(patchDeviceField(keys.presentationImageY, event.target.value))} />
          <ScaleField label="Escala" value={heroScale(details, keys.presentationImageScale)} onChange={(value) => onChange(patchDeviceField(keys.presentationImageScale, value))} />
        </div>
      </fieldset>
    </div>
  );
}

export function HeroPositionSection({
  details,
  editor,
  allowImageTextOverlay = false,
  onChange,
}: {
  details: CmsHeroSettings;
  editor: SharedHeroEditorState;
  allowImageTextOverlay?: boolean;
  onChange: (next: Partial<CmsHeroSettings>) => void;
}) {
  return (
    <SectionCard
      compact
      title="Posición responsive"
      description="Ajusta logo, menú y elementos del hero. Usa la vista previa para cambiar dispositivo."
    >
      <div className="cms-hero-position-grid">
        <HeroLogoMenuFields details={details} editor={editor} onChange={onChange} />
      </div>

      {editor.isImageHero ? <HeroMediaPositionFields details={details} editor={editor} onChange={onChange} /> : null}
      {editor.isImageHero ? <HeroOverlayPositionFields details={details} editor={editor} onChange={onChange} /> : null}
      {allowImageTextOverlay && editor.isImageHero ? <HeroTextPositionFields details={details} editor={editor} onChange={onChange} /> : null}
      {editor.isTextHero ? <HeroTextPositionFields details={details} editor={editor} onChange={onChange} /> : null}
      {editor.isPresentationHero ? (
        <HeroPresentationPositionFields details={details} editor={editor} onChange={onChange} />
      ) : null}
    </SectionCard>
  );
}
