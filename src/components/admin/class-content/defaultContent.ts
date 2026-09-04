import { DEFAULT_DESCRIPTION_TYPOGRAPHY } from "@/lib/cms/rich-text-typography";
import type { ClassOfferingContent } from "@/lib/cms/types";

export function defaultContent(): ClassOfferingContent {
  return {
    showCourseContent: undefined,
    showLearningSection: false,
    showParticipationSection: false,
    showPaymentMethodsSection: false,
    showModulesSection: false,
    learningSectionTitle: "",
    learningContent: "",
    learningContentTypography: { ...DEFAULT_DESCRIPTION_TYPOGRAPHY },
    showPostLearningSection: false,
    postLearningTitle: "",
    postLearningDescription: "",
    participationSectionTitle: "",
    participationContent: "",
    participationContentTypography: { ...DEFAULT_DESCRIPTION_TYPOGRAPHY },
    paymentMethods: "",
    paymentMethodsList: [],
    paymentMethodsSectionTitle: "Métodos de pago",
    contactWhatsapp: "",
    contactEmail: "",
    extraInfo: "",
    extraInfoTitle: "",
    showExtraInfoSection: false,
    extraInfoTypography: { ...DEFAULT_DESCRIPTION_TYPOGRAPHY },
    extraInfoBlocks: [],
    showEnrollButtonAtEnd: true,
    activitiesSection: { enabled: false, title: "", content: "", items: [] },
    modulesSectionTitle: "",
    modulesAccordionTitle: "",
    modules: [],
  };
}

export function createModuleId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `mod-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function createActivityId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `act-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function createExtraInfoBlockId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `extra-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
