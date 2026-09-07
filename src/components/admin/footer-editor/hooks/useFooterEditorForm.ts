"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo, useRef, useState } from "react";
import type { SiteSettings } from "@/lib/cms/settings";
import type { FooterComponent, Form, SocialLink } from "@/lib/cms/types";
import { publishFooterEditorErrorMessage } from "@/lib/cms/publish-footer-editor";
import {
  cloneSocialLinks,
  footerEditorFieldsFromItem,
  footerEditorSyncKey,
} from "../footerEditorState";
import {
  buildFooterSavePayload,
  footerPreviewFromFields,
  validateFooterForm,
  type FooterEditorFields,
} from "../utils";

import type { FooterContactFormEditor } from "./useFooterContactFormEditor";

export type FooterEditorMode = "create" | "edit";

export function useFooterEditorForm({
  mode,
  item,
  contactForm,
  siteContact,
  siteSettingsUpdatedAt,
  singleton = false,
  contactFormEditor,
}: {
  mode: FooterEditorMode;
  item?: FooterComponent;
  contactForm?: Form;
  siteContact?: SiteSettings["contact"];
  siteSettingsUpdatedAt?: string;
  singleton?: boolean;
  contactFormEditor?: FooterContactFormEditor;
}) {
  const router = useRouter();
  const initial = useMemo(
    () => footerEditorFieldsFromItem(item, siteContact),
    [item, siteContact],
  );
  const syncKey = footerEditorSyncKey(item, contactForm?.updated_at, siteSettingsUpdatedAt);

  const [previousSyncKey, setPreviousSyncKey] = useState(syncKey);
  const [name, setName] = useState(initial.name);
  const [logoId, setLogoId] = useState(initial.logoId);
  const [address, setAddress] = useState(initial.address);
  const [mapUrl, setMapUrl] = useState(initial.mapUrl);
  const [legalText, setLegalText] = useState(initial.legalText);
  const [contactTitle, setContactTitle] = useState(initial.contactTitle);
  const [contactText, setContactText] = useState(initial.contactText);
  const [buttonBackgroundColor, setButtonBackgroundColor] = useState(initial.buttonBackgroundColor);
  const [buttonContentColor, setButtonContentColor] = useState(initial.buttonContentColor);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>(() => cloneSocialLinks(initial.socialLinks));
  const [menuId, setMenuId] = useState(initial.menuId);
  const [newsletterEnabled, setNewsletterEnabled] = useState(initial.newsletterEnabled);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [modal, setModal] = useState<{ type: "success" | "error"; title: string; message?: string } | null>(null);
  const saveInFlightRef = useRef(false);

  if (syncKey !== previousSyncKey) {
    setPreviousSyncKey(syncKey);
    const next = footerEditorFieldsFromItem(item, siteContact);
    setName(next.name);
    setLogoId(next.logoId);
    setAddress(next.address);
    setMapUrl(next.mapUrl);
    setLegalText(next.legalText);
    setContactTitle(next.contactTitle);
    setContactText(next.contactText);
    setButtonBackgroundColor(next.buttonBackgroundColor);
    setButtonContentColor(next.buttonContentColor);
    setSocialLinks(cloneSocialLinks(next.socialLinks));
    setMenuId(next.menuId);
    setNewsletterEnabled(next.newsletterEnabled);
  }

  const fields: FooterEditorFields = useMemo(
    () => ({
      name,
      logoId,
      address,
      mapUrl,
      legalText,
      contactTitle,
      contactText,
      buttonBackgroundColor,
      buttonContentColor,
      socialLinks,
      menuId,
      newsletterEnabled,
    }),
    [
      address,
      buttonBackgroundColor,
      buttonContentColor,
      contactText,
      contactTitle,
      legalText,
      logoId,
      mapUrl,
      menuId,
      name,
      newsletterEnabled,
      socialLinks,
    ],
  );

  const previewFooter = useMemo(() => footerPreviewFromFields(fields, item), [fields, item]);

  const closeModal = useCallback(() => setModal(null), []);

  const addSocialLink = useCallback(() => {
    setSocialLinks((current) => [
      {
        platform: "",
        url: "",
        label: "",
        icon_url: "",
        icon_color: buttonContentColor,
        button_color: buttonBackgroundColor,
      },
      ...current,
    ]);
  }, [buttonBackgroundColor, buttonContentColor]);

  const updateSocialLink = useCallback((index: number, field: keyof SocialLink, value: string) => {
    setSocialLinks((current) => {
      const copy = [...current];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  }, []);

  const removeSocialLink = useCallback((index: number) => {
    setSocialLinks((current) => current.filter((_, i) => i !== index));
  }, []);

  const applySavedFooter = useCallback((saved: FooterComponent) => {
    const next = footerEditorFieldsFromItem(saved);
    setName(next.name);
    setLogoId(next.logoId);
    setAddress(next.address);
    setMapUrl(next.mapUrl);
    setLegalText(next.legalText);
    setContactTitle(next.contactTitle);
    setContactText(next.contactText);
    setButtonBackgroundColor(next.buttonBackgroundColor);
    setButtonContentColor(next.buttonContentColor);
    setSocialLinks(cloneSocialLinks(next.socialLinks));
    setMenuId(next.menuId);
    setNewsletterEnabled(next.newsletterEnabled);
  }, []);

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      if (saveInFlightRef.current) return;
      saveInFlightRef.current = true;
      setIsSaving(true);
      setError(null);
      setModal(null);

      const validationError = validateFooterForm(fields);
      if (validationError) {
        setError(validationError);
        setModal({ type: "error", title: "Faltan datos", message: validationError });
        setIsSaving(false);
        saveInFlightRef.current = false;
        return;
      }

      if (contactFormEditor) {
        const contactError = contactFormEditor.validate();
        if (contactError) {
          setError(contactError);
          setModal({ type: "error", title: "Revisa el formulario", message: contactError });
          setIsSaving(false);
          saveInFlightRef.current = false;
          return;
        }
      }

      const payload = buildFooterSavePayload(fields, item);
      const endpoint =
        mode === "create" ? "/api/admin/components/footers" : `/api/admin/components/footers/${item?.id}`;

      try {
        const body: Record<string, unknown> = {
          ...payload,
          sync_site_contact: singleton,
          contact_sync: singleton
            ? {
                address: fields.address,
                mapUrl: fields.mapUrl,
              }
            : undefined,
        };

        if (contactFormEditor) {
          body.contact_form_id = contactFormEditor.formId;
          body.contact_form = contactFormEditor.buildSavePayload();
        }

        const res = await fetch(endpoint, {
          method: mode === "create" ? "POST" : "PUT",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({ error: "Error" }));
          const message = (data as { error?: string }).error || "No se pudo publicar.";
          setError(message);
          setModal({ type: "error", title: "No se pudo guardar", message });
          return;
        }

        const responseBody = (await res.json().catch(() => ({}))) as {
          footer?: FooterComponent;
          form?: Form;
        };

        if (responseBody.footer) {
          applySavedFooter(responseBody.footer);
        } else {
          setSocialLinks(payload.social_links);
        }

        if (contactFormEditor && responseBody.form) {
          contactFormEditor.applySavedForm(responseBody.form);
        }

        setModal({
          type: "success",
          title: "Cambios publicados",
          message: contactFormEditor
            ? singleton
              ? "Footer y campos del formulario sincronizados. Dirección y mapa copiados a Configuración global → Contacto."
              : "Footer y campos del formulario sincronizados con la base de datos."
            : "Los cambios del footer global ya están listos.",
        });
        router.refresh();
        if (!singleton) router.push("/admin/components/footers");
      } catch (err) {
        const message = publishFooterEditorErrorMessage(err);
        setError(message);
        setModal({ type: "error", title: "No se pudo guardar", message });
      } finally {
        setIsSaving(false);
        saveInFlightRef.current = false;
      }
    },
    [applySavedFooter, contactFormEditor, fields, item, mode, router, singleton],
  );

  return {
    fields,
    previewFooter,
    includesContactForm: Boolean(contactFormEditor),
    name,
    setName,
    address,
    setAddress,
    mapUrl,
    setMapUrl,
    contactTitle,
    setContactTitle,
    contactText,
    setContactText,
    buttonBackgroundColor,
    setButtonBackgroundColor,
    buttonContentColor,
    setButtonContentColor,
    socialLinks,
    addSocialLink,
    updateSocialLink,
    removeSocialLink,
    error,
    isSaving,
    modal,
    closeModal,
    handleSubmit,
    singleton,
    mode,
  };
}

export type FooterEditorFormState = ReturnType<typeof useFooterEditorForm>;
