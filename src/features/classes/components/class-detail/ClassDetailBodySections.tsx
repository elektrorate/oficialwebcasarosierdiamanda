import { Accordion } from "@/components/collections/Accordion";
import { MarkdownContent } from "@/components/ui/MarkdownContent";
import type { ExperienceItem } from "@/data/types";
import {
  DEFAULT_DESCRIPTION_TYPOGRAPHY,
  DEFAULT_RICH_TEXT_TYPOGRAPHY,
  normalizeRichTextTypography,
  richTextTypographyStyle,
} from "@/lib/cms/rich-text-typography";
import { ClassDetailIncludesList } from "./ClassDetailIncludesList";

type Props = {
  item: ExperienceItem;
  showIncluded: boolean;
  hasParticipationContent: boolean;
  showProgram: boolean;
  programItems: ExperienceItem["program"];
};

export function ClassDetailLearningSection({
  item,
  hasLearningContent,
}: {
  item: ExperienceItem;
  hasLearningContent: boolean;
}) {
  if (!hasLearningContent) return null;

  return (
    <section className="class-detail__text-block class-detail__learning-section">
      <h2>{item.learningSectionTitle || "Que aprendes..."}</h2>
      <MarkdownContent
        source={item.whatYouWillLearn}
        className="class-detail__content-copy"
        style={richTextTypographyStyle(
          normalizeRichTextTypography(item.whatYouWillLearnTypography ?? DEFAULT_DESCRIPTION_TYPOGRAPHY),
        )}
      />
    </section>
  );
}

export function ClassDetailPostLearningSection({ item }: { item: ExperienceItem }) {
  const title = item.postLearningTitle?.trim() ?? "";
  const description = item.postLearningDescription?.trim() ?? "";

  if (item.showPostLearningSection !== true || (!title && !description)) return null;

  return (
    <section className="class-detail__text-block class-detail__post-learning-section">
      {title ? <h2>{title}</h2> : null}
      {description ? <p>{description}</p> : null}
    </section>
  );
}

export function ClassDetailPostFactsSections({
  item,
  showIncluded,
  hasParticipationContent,
  showProgram,
  programItems,
}: Props) {
  return (
    <div className="class-detail__body-stack">
      {showIncluded ? (
        <section className="class-detail__includes class-detail__includes--editorial">
          <h2>{item.includedSectionTitle || "Incluye"}</h2>
          <ClassDetailIncludesList
            included={item.included}
            typography={item.includedTypography ?? { ...DEFAULT_RICH_TEXT_TYPOGRAPHY, fontSize: 16 }}
          />
        </section>
      ) : null}

      {hasParticipationContent ? (
        <section className="class-detail__text-block class-detail__participation-section">
          <h2>{item.participationSectionTitle || "Quien puede ser"}</h2>
          <MarkdownContent
            source={item.whoCanJoin}
            className="class-detail__content-copy"
            style={richTextTypographyStyle(
              normalizeRichTextTypography(item.whoCanJoinTypography ?? DEFAULT_DESCRIPTION_TYPOGRAPHY),
            )}
          />
        </section>
      ) : null}

{showProgram ? (
        <section className="class-detail__program">
          <h2>{item.programSectionTitle || "Silabus del curso"}</h2>
          {item.modulesAccordionTitle ? <p className="class-detail__program-accordion-title">{item.modulesAccordionTitle}</p> : null}
          <Accordion items={programItems} />
        </section>
      ) : null}

      {item.activitiesSection?.enabled && item.activitiesSection.items.length ? (
        <section className="class-detail__activities">
          <h2>{item.activitiesSection.title || "Actividades"}</h2>
          {item.activitiesSection.content ? (
            <MarkdownContent
              source={item.activitiesSection.content}
              className="class-detail__content-copy"
              style={richTextTypographyStyle(
                normalizeRichTextTypography(item.descriptionTypography ?? DEFAULT_DESCRIPTION_TYPOGRAPHY),
              )}
            />
          ) : null}
          {item.activitiesSection.items.map((activity) => (
            <article className="class-detail__activity" key={activity.id}>
              {activity.image ? <img src={activity.image} alt={activity.title} loading="lazy" /> : null}
              {activity.title ? <h3>{activity.title}</h3> : null}
              {activity.description ? <p>{activity.description}</p> : null}
            </article>
          ))}
        </section>
      ) : null}
    </div>
  );
}
