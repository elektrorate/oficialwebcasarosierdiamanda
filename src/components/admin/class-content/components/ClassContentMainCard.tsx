"use client";

import { memo } from "react";
import Card from "@/components/ui/Card";
import Switch from "@/components/ui/Switch";
import type { ClassContentEditor } from "../hooks/useClassContentEditor";
import { ClassContentAdditionalInfoBlocksEditor } from "./ClassContentAdditionalInfoBlocksEditor";
import { ClassContentPaymentMethodsEditor } from "./ClassContentPaymentMethodsEditor";
import { ClassContentRichTextField } from "./ClassContentRichTextField";
import { ClassContentTextField } from "./ClassContentTextField";

type ClassContentMainCardProps = Pick<
  ClassContentEditor,
  | "content"
  | "typography"
  | "paymentMethods"
  | "setField"
  | "addPaymentMethod"
  | "updatePaymentMethod"
  | "removePaymentMethod"
  | "addExtraInfoBlock"
  | "updateExtraInfoBlock"
  | "moveExtraInfoBlock"
  | "removeExtraInfoBlock"
  | "resolveModuleTypography"
>;

function ClassContentMainCardComponent({
  content,
  typography,
  paymentMethods,
  setField,
  addPaymentMethod,
  updatePaymentMethod,
  removePaymentMethod,
  addExtraInfoBlock,
  updateExtraInfoBlock,
  moveExtraInfoBlock,
  removeExtraInfoBlock,
  resolveModuleTypography,
}: ClassContentMainCardProps) {
  return (
    <Card padding="lg" className="space-y-5 rounded-2xl">
      <h2 className="text-headline-sm text-on-surface">Contenido del Curso</h2>

      <Switch
        checked={content.showParticipationSection}
        label="Mostrar ¿Quién puede participar? en la página pública"
        description="El texto permanece guardado aunque esta sección esté oculta."
        onCheckedChange={(checked) => setField("showParticipationSection", checked)}
      />

      <ClassContentTextField
        label="Título de la sección '¿Quién puede participar?'"
        value={content.participationSectionTitle}
        placeholder="QUE INCLUYE"
        onChange={(event) => setField("participationSectionTitle", event.target.value)}
      />

      <ClassContentRichTextField
        label="¿Quién puede participar?"
        value={content.participationContent}
        typography={typography.participation}
        minHeight="200px"
        placeholder="Materiales básicos para cada clase (arcillas, engobes, esmaltes comerciales).&#10;Uso de herramientas y horno durante las sesiones presenciales."
        onChange={(value) => setField("participationContent", value)}
        onTypographyChange={(participationContentTypography) => setField("participationContentTypography", participationContentTypography)}
      />

      <ClassContentPaymentMethodsEditor
        content={content}
        paymentMethods={paymentMethods}
        setField={setField}
        addPaymentMethod={addPaymentMethod}
        updatePaymentMethod={updatePaymentMethod}
        removePaymentMethod={removePaymentMethod}
      />

      <Switch
        checked={content.showExtraInfoSection === true}
        label="Mostrar 'Información adicional' en la página pública"
        description="El texto permanece guardado aunque esta sección esté oculta."
        onCheckedChange={(checked) => setField("showExtraInfoSection", checked)}
      />

      <ClassContentTextField
        label="Título de 'Información adicional'"
        value={content.extraInfoTitle ?? ""}
        placeholder="Información adicional"
        onChange={(event) => setField("extraInfoTitle", event.target.value)}
      />

      <ClassContentRichTextField
        label="Información extra (opcional)"
        value={content.extraInfo}
        typography={typography.extraInfo}
        placeholder="Añade información adicional si es necesaria..."
        minHeight="150px"
        onChange={(value) => setField("extraInfo", value)}
        onTypographyChange={(extraInfoTypography) => setField("extraInfoTypography", extraInfoTypography)}
      />

      <ClassContentAdditionalInfoBlocksEditor
        content={content}
        addExtraInfoBlock={addExtraInfoBlock}
        updateExtraInfoBlock={updateExtraInfoBlock}
        moveExtraInfoBlock={moveExtraInfoBlock}
        removeExtraInfoBlock={removeExtraInfoBlock}
        resolveModuleTypography={resolveModuleTypography}
      />

      <div className="space-y-3 rounded-xl border border-outline-variant p-4">
        <p className="text-body-md font-semibold text-on-surface">Contacto</p>
        <ClassContentTextField
          label="WhatsApp de contacto"
          value={content.contactWhatsapp}
          placeholder="34633788860"
          help="Sin espacios ni símbolos. Se usa como fallback en el botón de inscripción."
          onChange={(event) => setField("contactWhatsapp", event.target.value)}
        />
        <ClassContentTextField
          label="Email de contacto"
          value={content.contactEmail}
          placeholder="hola@casarosier.es"
          help="Se usa como último recurso de contacto si no hay WhatsApp disponible."
          onChange={(event) => setField("contactEmail", event.target.value)}
        />
      </div>

      <Switch
        checked={content.showEnrollButtonAtEnd}
        label="Botón de inscripción al final de la ficha"
        description="Si está activo, el botón de inscribirse se muestra tras el contenido; si no, se muestra junto a las acciones principales."
        onCheckedChange={(checked) => setField("showEnrollButtonAtEnd", checked)}
      />
    </Card>
  );
}

export const ClassContentMainCard = memo(ClassContentMainCardComponent);
