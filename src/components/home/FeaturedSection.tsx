import type { ExperienceItem } from "@/data/types";
import { FeaturedExperienceCards } from "@/components/home/FeaturedExperienceCards";
import { HomeSection } from "@/components/home/HomeSection";

interface FeaturedSectionProps {
  id: string;
  title: string;
  subtitle: string;
  description?: string;
  items: readonly ExperienceItem[];
  variant?: string;
}

export function FeaturedSection({
  id,
  title,
  subtitle,
  description,
  items,
  variant,
}: FeaturedSectionProps) {
  return (
    <HomeSection id={id} title={title} subtitle={subtitle} description={description} variant={variant} editorialSpacing>
      <FeaturedExperienceCards items={items} />
    </HomeSection>
  );
}
