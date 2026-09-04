"use client";

import type { ExperienceItem } from "@/data/types";
import { useClassDetailViewModel } from "../../hooks/useClassDetailViewModel";
import {
  ClassDetailLearningSection,
  ClassDetailPostLearningSection,
  ClassDetailPostFactsSections,
} from "./ClassDetailBodySections";
import { ClassDetailEnrollActions } from "./ClassDetailEnrollActions";
import { ClassDetailGallery } from "./ClassDetailGallery";
import { ClassDetailIntro } from "./ClassDetailIntro";
import { ClassDetailDescription, ClassDetailLeadIntro } from "./ClassDetailLeadCopy";
import { ClassDetailSidebarColumn } from "./ClassDetailMediaColumn";
import { ClassDetailPriceDuration } from "./ClassDetailPriceDuration";

type Props = {
  item: ExperienceItem;
  titleLevel?: "h1" | "h2";
};

export function ClassDetailSection({ item, titleLevel = "h1" }: Props) {
  const viewModel = useClassDetailViewModel(item);

  return (
    <section className="class-detail class-detail--proposal section">
      <div className="container class-detail__container">
        <div className="class-detail__layout">
          <section className="class-detail__intro-column">
            <ClassDetailIntro item={item} titleLevel={titleLevel} />
            <ClassDetailLeadIntro item={item} />
            <div className="class-detail__description-desktop">
              <ClassDetailDescription item={item} />
            </div>
            <div className="class-detail__learning-placement class-detail__learning-placement--desktop">
              <ClassDetailLearningSection
                item={item}
                hasLearningContent={viewModel.hasLearningContent}
              />
            </div>
          </section>

          <section className="class-detail__media-column">
            <div className="class-detail__gallery-sticky">
              <ClassDetailGallery item={item} />
            </div>
          </section>

          <section className="class-detail__content-column">
            <div className="class-detail__description-mobile">
              <ClassDetailDescription item={item} />
            </div>
            <div className="class-detail__learning-placement class-detail__learning-placement--mobile">
              <ClassDetailLearningSection
                item={item}
                hasLearningContent={viewModel.hasLearningContent}
              />
            </div>
            <ClassDetailPostLearningSection item={item} />
            <ClassDetailPriceDuration item={item} />
            {viewModel.showEnrollAction && viewModel.showEnrollAtEnd ? (
              <div className="class-detail__enroll-placement class-detail__enroll-placement--desktop">
                <ClassDetailEnrollActions
                  consultHref=""
                  consultLabel={viewModel.consultLabel}
                  enrollHref={viewModel.enrollHref}
                  enrollLabel={viewModel.enrollLabel}
                  showEnroll
                />
              </div>
            ) : null}
            <ClassDetailEnrollActions
              consultHref={viewModel.consultHref}
              consultLabel={viewModel.consultLabel}
              enrollHref={viewModel.enrollHref}
              enrollLabel={viewModel.enrollLabel}
              showEnroll={viewModel.showEnrollAction && !viewModel.showEnrollAtEnd}
            />
            <ClassDetailPostFactsSections
              item={item}
              showIncluded={viewModel.showIncluded}
              hasParticipationContent={viewModel.hasParticipationContent}
              showProgram={viewModel.showProgram}
              programItems={viewModel.programItems}
            />
            {viewModel.showEnrollAction && viewModel.showEnrollAtEnd ? (
              <div className="class-detail__enroll-placement class-detail__enroll-placement--mobile">
                <ClassDetailEnrollActions
                  consultHref=""
                  consultLabel={viewModel.consultLabel}
                  enrollHref={viewModel.enrollHref}
                  enrollLabel={viewModel.enrollLabel}
                  showEnroll
                />
              </div>
            ) : null}
          </section>

          <ClassDetailSidebarColumn
            item={item}
            showPaymentMethods={viewModel.showPaymentMethods}
            hasSideContent={viewModel.hasSideContent}
            calendarLabels={viewModel.calendarLabels}
          />
        </div>
      </div>
    </section>
  );
}
