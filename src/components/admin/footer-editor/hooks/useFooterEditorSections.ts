"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  defaultFooterEditorSection,
  footerEditorSectionFromHash,
  footerEditorTabs,
  FOOTER_EDITOR_SECTION_HASH,
  type FooterEditorSectionKey,
} from "../footerEditorSections";

export function useFooterEditorSections(options: { singleton: boolean; hasContactForm: boolean }) {
  const { singleton, hasContactForm } = options;
  const tabs = useMemo(
    () => footerEditorTabs({ singleton, hasContactForm }),
    [hasContactForm, singleton],
  );

  const [activeTab, setActiveTab] = useState<FooterEditorSectionKey>(() =>
    defaultFooterEditorSection({ singleton, hasContactForm }),
  );

  useEffect(() => {
    const syncFromHash = () => {
      const fromHash = footerEditorSectionFromHash(window.location.hash, { hasContactForm });
      if (fromHash) setActiveTab(fromHash);
    };

    const initialSyncTimer = window.setTimeout(syncFromHash, 0);
    window.addEventListener("hashchange", syncFromHash);

    return () => {
      window.clearTimeout(initialSyncTimer);
      window.removeEventListener("hashchange", syncFromHash);
    };
  }, [hasContactForm]);

  const selectTab = useCallback((key: FooterEditorSectionKey) => {
    setActiveTab(key);
    const hash = FOOTER_EDITOR_SECTION_HASH[key];
    const nextUrl = hash
      ? `${window.location.pathname}${window.location.search}#${hash}`
      : `${window.location.pathname}${window.location.search}`;
    window.history.replaceState(null, "", nextUrl);
  }, []);

  return {
    tabs,
    activeTab,
    selectTab,
  };
}

export type FooterEditorSectionsState = ReturnType<typeof useFooterEditorSections>;
