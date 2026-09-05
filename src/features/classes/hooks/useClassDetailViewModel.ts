"use client";

import { useMemo } from "react";
import type { ExperienceItem } from "@/data/types";
import {
  hasMeaningfulContent,
  hasMeaningfulProgramItem,
  visibleCalendarLabels,
} from "../lib/classDetailContent";

export function useClassDetailViewModel(item: ExperienceItem) {
  return useMemo(() => {
    const programItems = item.program.filter(hasMeaningfulProgramItem);
    const calendarLabels = visibleCalendarLabels(item);
    const showPaymentMethods = item.showPaymentMethodsSection && item.paymentMethods.length > 0;
    const showProgram = item.showModulesSection && programItems.length > 0;
    const showIncluded = item.showIncludedSection && hasMeaningfulContent(item.included);
    const hasLearningContent = item.showLearningSection && hasMeaningfulContent(item.whatYouWillLearn);
    const hasParticipationContent = item.showParticipationSection && hasMeaningfulContent(item.whoCanJoin);
    const hasCalendarLabels = calendarLabels.length > 0;
    const hasSideContent = Boolean(
      showPaymentMethods ||
        (item.showAdditionalInfoSection !== false && hasMeaningfulContent(item.additionalInfo)) ||
        hasCalendarLabels,
    );

    const consultHref = item.ctaConsultHref || item.ctaHref;
    const enrollHref = item.ctaEnrollHref || "";
    const isGiftCard = item.kind === "gift-card";
    const consultLabel = item.ctaConsultLabel || (isGiftCard ? "Comprar" : "Consultar");
    const enrollLabel = item.ctaEnrollLabel || (isGiftCard ? "Anadir al carrito" : "Inscribirse");
    const showEnrollAction = item.showEnrollCta !== false && Boolean(enrollHref);
    const showEnrollAtEnd = item.showEnrollButtonAtEnd === true;

    return {
      programItems,
      calendarLabels,
      showPaymentMethods,
      showProgram,
      showIncluded,
      hasLearningContent,
      hasParticipationContent,
      hasCalendarLabels,
      hasSideContent,
      consultHref,
      enrollHref,
      consultLabel,
      enrollLabel,
      showEnrollAction,
      showEnrollAtEnd,
    };
  }, [item]);
}
