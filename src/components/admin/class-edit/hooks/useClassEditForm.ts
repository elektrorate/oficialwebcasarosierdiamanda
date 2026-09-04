"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import type { ClassHomeCard, ClassOfferingContent, ClassOfferingDetails, Offering } from "@/lib/cms/types";
import { uploadAdminMediaFile } from "@/lib/admin/media-upload-client";
import { MAX_CALENDAR_LABELS, MAX_GALLERY_IMAGES } from "../constants";
import type {
  FormNotice,
  PickerTarget,
  SaveIntent,
  TabKey,
  UploadOptimization,
  UploadTarget,
} from "../types";
import {
  buildOfferingPayload,
  createId,
  daysInMonth,
  errorTab,
  focusValidationTarget,
  slugify,
  toClassDetails,
  markdownToIncludedItems,
  validateClassEditForm,
  validationDetails,
} from "../utils";

export function useClassEditForm({
  offering,
  mode = "edit",
  basePath = "/admin/clases",
}: {
  offering: Offering;
  mode?: "create" | "edit";
  basePath?: string;
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>("hero");
  const [title, setTitle] = useState(offering.title);
  const [slug, setSlug] = useState(offering.slug);
  const [subtitle, setSubtitle] = useState(offering.subtitle);
  const [description, setDescription] = useState(offering.description);
  const [status, setStatus] = useState<"draft" | "published">(offering.status === "published" ? "published" : "draft");
  const [seoTitle, setSeoTitle] = useState(offering.seo_title);
  const [seoDescription, setSeoDescription] = useState(offering.seo_description);
  const [details, setDetails] = useState<ClassOfferingDetails>(() => toClassDetails(offering));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<FormNotice | null>(null);
  const [pendingValidationFocus, setPendingValidationFocus] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savingIntent, setSavingIntent] = useState<SaveIntent | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<PickerTarget>(null);
  const [draggedGalleryIndex, setDraggedGalleryIndex] = useState<number | null>(null);
  const [uploadingTarget, setUploadingTarget] = useState<UploadTarget | null>(null);
  const [galleryUploadInfo, setGalleryUploadInfo] = useState<Record<string, UploadOptimization>>({});
  const [currency, setCurrency] = useState<string>((offering.currency || "EUR").trim().toUpperCase() || "EUR");

  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (!isDirty) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const markDirty = useCallback(() => setIsDirty(true), []);

  const updateDetails = useCallback((next: Partial<ClassOfferingDetails>) => {
    setDetails((current) => ({ ...current, ...next }));
    setIsDirty(true);
  }, []);

  const updateHomeCard = useCallback((next: Partial<ClassHomeCard>) => {
    setDetails((current) => ({
      ...current,
      homeCard: { ...current.homeCard, ...next },
    }));
    setIsDirty(true);
  }, []);

  const updatePricing = useCallback((index: number, next: Partial<ClassOfferingDetails["pricing"][number]>) => {
    setDetails((current) => ({
      ...current,
      pricing: current.pricing.map((item, i) => (i === index ? { ...item, ...next } : item)),
    }));
    setIsDirty(true);
  }, []);

  const addPricing = useCallback(() => {
    setDetails((current) => ({
      ...current,
      pricing: [...current.pricing, { description: "", price: null, order: current.pricing.length }],
    }));
    setIsDirty(true);
  }, []);

  const removePricing = useCallback((index: number) => {
    setDetails((current) => ({
      ...current,
      pricing: current.pricing.filter((_, i) => i !== index).map((item, order) => ({ ...item, order })),
    }));
    setIsDirty(true);
  }, []);

  const updateGalleryImage = useCallback((index: number, next: Partial<ClassOfferingDetails["galleryImages"][number]>) => {
    setDetails((current) => ({
      ...current,
      galleryImages: current.galleryImages.map((item, i) => (i === index ? { ...item, ...next } : item)),
    }));
    setIsDirty(true);
  }, []);

  const moveGalleryImage = useCallback((from: number, to: number) => {
    setDetails((current) => {
      if (to < 0 || to >= current.galleryImages.length || from === to) return current;
      const next = [...current.galleryImages];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return { ...current, galleryImages: next.map((item, order) => ({ ...item, order })) };
    });
    setIsDirty(true);
  }, []);

  const removeGalleryImage = useCallback((index: number) => {
    setDetails((current) => ({
      ...current,
      galleryImages: current.galleryImages.filter((_, i) => i !== index).map((item, order) => ({ ...item, order })),
    }));
    setIsDirty(true);
  }, []);

  const updateIncludedItems = useCallback((value: string) => {
    updateDetails({ includedItems: markdownToIncludedItems(value) });
  }, [updateDetails]);

  const handleContentChange = useCallback(
    (content: ClassOfferingContent) => updateDetails({ content }),
    [updateDetails],
  );

  const addCalendarLabel = useCallback(() => {
    setDetails((current) => {
      if (current.calendarLabels.length >= MAX_CALENDAR_LABELS) return current;
      const now = new Date();
      return {
        ...current,
        calendarLabels: [
          ...current.calendarLabels,
          {
            id: createId("calendar-label"),
            month: now.getMonth() + 1,
            year: now.getFullYear(),
            days: [],
            active: true,
            order: current.calendarLabels.length,
            availabilityText: "",
          },
        ],
      };
    });
    setIsDirty(true);
  }, []);

  const updateCalendarLabel = useCallback((index: number, next: Partial<ClassOfferingDetails["calendarLabels"][number]>) => {
    setDetails((current) => ({
      ...current,
      calendarLabels: current.calendarLabels.map((item, i) => {
        if (i !== index) return item;
        const month = next.month ?? item.month;
        const year = next.year ?? item.year;
        const maxDay = daysInMonth(Number(year), Number(month));
        const days = (next.days ?? item.days).filter((day) => day >= 1 && day <= maxDay);
        return { ...item, ...next, month, year, days };
      }),
    }));
    setIsDirty(true);
  }, []);

  const toggleCalendarDay = useCallback((index: number, day: number) => {
    setDetails((current) => {
      const label = current.calendarLabels[index];
      if (!label) return current;
      const maxDay = daysInMonth(label.year, label.month);
      if (day < 1 || day > maxDay) return current;
      const days = label.days.includes(day)
        ? label.days.filter((item) => item !== day)
        : [...label.days, day].sort((a, b) => a - b);
      return {
        ...current,
        calendarLabels: current.calendarLabels.map((item, i) => (i === index ? { ...item, days } : item)),
      };
    });
    setIsDirty(true);
  }, []);

  const removeCalendarLabel = useCallback((index: number) => {
    setDetails((current) => ({
      ...current,
      calendarLabels: current.calendarLabels.filter((_, i) => i !== index).map((item, order) => ({ ...item, order })),
    }));
    setIsDirty(true);
  }, []);

  const moveCalendarLabel = useCallback((from: number, to: number) => {
    setDetails((current) => {
      if (to < 0 || to >= current.calendarLabels.length || from === to) return current;
      const next = [...current.calendarLabels];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return { ...current, calendarLabels: next.map((item, order) => ({ ...item, order })) };
    });
    setIsDirty(true);
  }, []);

  const applyImageToTarget = useCallback((target: PickerTarget | UploadTarget, url: string) => {
    if (target === "hero") updateDetails({ heroImage: url });
    if (target === "home") updateHomeCard({ image: url });
    if (target === "presentation") updateDetails({ heroPresentationImage: url });
    if (target === "title") updateDetails({ titleImage: url });
    if (target === "titleSecondary") updateDetails({ titleImageSecondary: url });
    if (target === "seo") updateDetails({ seoImage: url });
    if (target === "videoPoster") updateDetails({ videoPoster: url });
    if (target === "gallery") {
      setDetails((current) => ({
        ...current,
        galleryImages: current.galleryImages.length >= MAX_GALLERY_IMAGES
          ? current.galleryImages
          : [...current.galleryImages, {
              image: url,
              alt: "",
              seoTitle: "",
              seoDescription: "",
              modalDescription: "",
              showCta: false,
              ctaLabel: "Más información",
              ctaHref: "",
              ctaNewTab: false,
              order: current.galleryImages.length,
            }],
      }));
      setIsDirty(true);
    }
    if (target === "gallery:new") {
      setDetails((current) => ({
        ...current,
        galleryImages: current.galleryImages.length >= MAX_GALLERY_IMAGES
          ? current.galleryImages
          : [...current.galleryImages, {
              image: url,
              alt: "",
              seoTitle: "",
              seoDescription: "",
              modalDescription: "",
              showCta: false,
              ctaLabel: "Más información",
              ctaHref: "",
              ctaNewTab: false,
              order: current.galleryImages.length,
            }],
      }));
      setIsDirty(true);
    }
    if (typeof target === "string" && target.startsWith("gallery:")) {
      const index = Number(target.split(":")[1]);
      if (Number.isInteger(index)) updateGalleryImage(index, { image: url });
    }
  }, [updateDetails, updateGalleryImage, updateHomeCard]);

  const handleSelectImage = useCallback((url: string) => {
    applyImageToTarget(pickerTarget, url);
    setPickerTarget(null);
  }, [applyImageToTarget, pickerTarget]);

  const uploadImage = useCallback(async (target: UploadTarget, file: File) => {
    setUploadingTarget(target);
    setToast(null);

    const result = await uploadAdminMediaFile({
      file,
      folder: "offerings",
      title: file.name,
      altText: title || file.name,
    });

    if (!result.ok) {
      setToast({ type: "error", message: result.error });
      setUploadingTarget(null);
      return;
    }

    applyImageToTarget(target, result.fileUrl);
    if ((target === "gallery:new" || target.startsWith("gallery:")) && result.optimization) {
      setGalleryUploadInfo((previous) => ({
        ...previous,
        [result.fileUrl]: {
          originalSize: result.optimization!.originalSize,
          finalSize: result.optimization!.finalSize,
          reductionPercent: result.optimization!.reductionPercent,
        },
      }));
    }

    setUploadingTarget(null);
  }, [applyImageToTarget, title]);

  const handleSubmit = useCallback(async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setToast(null);

    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const intent: SaveIntent = submitter?.value === "publish" ? "publish" : "draft";
    const nextStatus = intent === "publish" ? "published" : "draft";

    const validationErrors = validateClassEditForm({ title, slug, details });
    const validationKeys = Object.keys(validationErrors);
    if (validationKeys.length > 0) {
      const firstErrorKey = validationKeys[0];
      setPendingValidationFocus(firstErrorKey);
      setActiveTab(errorTab(firstErrorKey));
      setErrors(validationErrors);
      setToast({
        type: "error",
        message: `Encontré ${validationKeys.length === 1 ? "1 campo que necesita atención" : `${validationKeys.length} campos que necesitan atención`}.`,
        details: validationDetails(validationErrors),
      });
      return;
    }

    setIsSaving(true);
    setSavingIntent(intent);

    try {
      const response = await fetch(
        mode === "create" ? "/api/admin/offerings" : `/api/admin/offerings/${offering.id}`,
        {
          method: mode === "create" ? "POST" : "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(buildOfferingPayload({
            offering,
            title,
            slug,
            subtitle,
            description,
            details,
            nextStatus,
            seoTitle,
            seoDescription,
            currency,
          })),
        },
      );

      const data = (await response.json().catch(() => ({}))) as { offering?: Offering; error?: string };
      if (!response.ok) {
        setToast({ type: "error", message: data.error || "No se pudieron guardar los cambios." });
        return;
      }

      setStatus(nextStatus);
      setIsDirty(false);
      setErrors({});
      setToast({
        type: "success",
        message: nextStatus === "published" ? "Publicado exitosamente." : "Borrador guardado correctamente.",
      });
      if (mode === "create" && data.offering?.id) {
        router.push(`${basePath}/${data.offering.id}/edit`);
      } else {
        router.refresh();
      }
    } catch {
      setToast({ type: "error", message: "No se pudo conectar con el servidor. Intenta nuevamente." });
    } finally {
      setIsSaving(false);
      setSavingIntent(null);
    }
  }, [basePath, currency, description, details, mode, offering, router, seoDescription, seoTitle, slug, subtitle, title]);

  const handleCancel = useCallback(() => {
    if (isDirty && !window.confirm("Hay cambios sin guardar. ¿Salir igualmente?")) return;
    router.push(basePath);
  }, [basePath, isDirty, router]);

  const closeToast = useCallback(() => {
    const focusKey = toast?.type === "error" ? pendingValidationFocus : null;
    setToast(null);
    if (focusKey) {
      focusValidationTarget(focusKey);
      setPendingValidationFocus(null);
    }
  }, [pendingValidationFocus, toast?.type]);

  return {
    activeTab,
    setActiveTab,
    title,
    setTitle,
    slug,
    setSlug,
    subtitle,
    setSubtitle,
    description,
    setDescription,
    status,
    seoTitle,
    setSeoTitle,
    seoDescription,
    setSeoDescription,
    details,
    errors,
    toast,
    closeToast,
    isSaving,
    savingIntent,
    isDirty,
    markDirty,
    pickerTarget,
    setPickerTarget,
    draggedGalleryIndex,
    setDraggedGalleryIndex,
    uploadingTarget,
    galleryUploadInfo,
    currency,
    setCurrency,
    updateDetails,
    updateHomeCard,
    updatePricing,
    addPricing,
    removePricing,
    updateGalleryImage,
    moveGalleryImage,
    removeGalleryImage,
    updateIncludedItems,
    handleContentChange,
    addCalendarLabel,
    updateCalendarLabel,
    toggleCalendarDay,
    removeCalendarLabel,
    moveCalendarLabel,
    handleSelectImage,
    uploadImage,
    handleSubmit,
    handleCancel,
    slugify,
  };
}

export type ClassEditFormState = ReturnType<typeof useClassEditForm>;
