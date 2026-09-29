import type { ExperienceItem } from "@/data/types";

export function isClassOrExperience(item: ExperienceItem) {
  return item.kind === "class" || item.kind === "private-booking";
}

export function getClassAndExperienceItems(items: ExperienceItem[]) {
  return items.filter(isClassOrExperience);
}
