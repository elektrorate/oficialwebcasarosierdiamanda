type OfferingDetailsObject = Record<string, unknown>;

function detailsObject(value: unknown): OfferingDetailsObject {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as OfferingDetailsObject
    : {};
}

/**
 * Modern offering fields live under `details.class`. When that object contains
 * an explicit empty value, it must still win over the legacy root value so a
 * deleted CMS block cannot reappear on the public page.
 */
export function mergeCurrentOfferingDetails(value: unknown): OfferingDetailsObject {
  const root = detailsObject(value);
  const current = detailsObject(root.class);
  return { ...root, ...current };
}

/**
 * Once the editor persists the modern `details.class` model, neutralize only
 * the legacy aliases that have a current equivalent. Keeping them populated
 * would allow old copy to resurface whenever a modern field is intentionally
 * left empty.
 */
export function clearLegacyOfferingContent(value: unknown): OfferingDetailsObject {
  return {
    ...detailsObject(value),
    category: "",
    introHighlight: "",
    videoCardImage: "",
    videoCardLabel: "",
    included: [],
    program: [],
    whatYouWillLearn: [],
    whoCanJoin: [],
    paymentMethods: [],
    additionalInfo: "",
    ctaHref: "",
    ctaConsultHref: "",
    ctaEnrollHref: "",
    ctaConsultLabel: "",
    ctaEnrollLabel: "",
  };
}
