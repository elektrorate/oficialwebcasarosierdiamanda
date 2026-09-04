"use client";

import { memo } from "react";
import { ClassContentActivitiesCard } from "./components/ClassContentActivitiesCard";
import { ClassContentMainCard } from "./components/ClassContentMainCard";
import { ClassContentModulesCard } from "./components/ClassContentModulesCard";
import { useClassContentEditor, type ClassContentEditorProps } from "./hooks/useClassContentEditor";

function ClassContentTabViewComponent(props: ClassContentEditorProps) {
  const editor = useClassContentEditor(props);

  return (
    <div className="space-y-6">
      <ClassContentMainCard
        content={editor.content}
        typography={editor.typography}
        paymentMethods={editor.paymentMethods}
        setField={editor.setField}
        addPaymentMethod={editor.addPaymentMethod}
        updatePaymentMethod={editor.updatePaymentMethod}
        removePaymentMethod={editor.removePaymentMethod}
        addExtraInfoBlock={editor.addExtraInfoBlock}
        updateExtraInfoBlock={editor.updateExtraInfoBlock}
        moveExtraInfoBlock={editor.moveExtraInfoBlock}
        removeExtraInfoBlock={editor.removeExtraInfoBlock}
        resolveModuleTypography={editor.resolveModuleTypography}
      />
      <ClassContentModulesCard
        content={editor.content}
        setField={editor.setField}
        addModule={editor.addModule}
        updateModule={editor.updateModule}
        duplicateModule={editor.duplicateModule}
        removeModule={editor.removeModule}
        resolveModuleTypography={editor.resolveModuleTypography}
      />
      <ClassContentActivitiesCard
        content={editor.content}
        updateActivitiesSection={editor.updateActivitiesSection}
        addActivity={editor.addActivity}
        updateActivity={editor.updateActivity}
        moveActivity={editor.moveActivity}
        removeActivity={editor.removeActivity}
      />
    </div>
  );
}

export const ClassContentTabView = memo(ClassContentTabViewComponent);
