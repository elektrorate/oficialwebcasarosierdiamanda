"use client";

import type { ExperienceItem } from "@/data/types";
import { useClassDetailViewModel } from "../../hooks/useClassDetailViewModel";
import { ClassDetailBodySections } from "./ClassDetailBodySections";
import { ClassDetailEnrollActions } from "./ClassDetailEnrollActions";
import { ClassDetailIntro } from "./ClassDetailIntro";
import { ClassDetailLeadCopy } from "./ClassDetailLeadCopy";
import { ClassDetailGallery } from "./ClassDetailGallery";
import { ClassDetailMediaColumn } from "./ClassDetailMediaColumn";
import { ClassDetailPriceDuration } from "./ClassDetailPriceDuration";

type Props = {
  item: ExperienceItem;
  titleLevel?: "h1" | "h2";
};

export function ClassDetailSection({ item, titleLevel = "h1" }: Props) {
  const viewModel = useClassDetailViewModel(item);

  return (
    <section className="class-detail section pt-9 pb-24">
      <div className="container class-detail__container max-w-295">
        <div className="class-detail__mobile-intro hidden max-[992px]:block max-[992px]:w-[min(100%,680px)] max-[992px]:mx-auto max-[992px]:mb-[clamp(22px,5vw,34px)]">
          <ClassDetailIntro item={item} titleLevel={titleLevel} />
          <ClassDetailLeadCopy item={item} />
        </div>

        <div className="class-detail__layout grid grid-cols-[minmax(320px,420px)_minmax(0,1fr)] gap-[48px] items-start max-[992px]:grid-cols-1 max-[992px]:gap-8.5">
          <ClassDetailMediaColumn
            item={item}
            showPaymentMethods={viewModel.showPaymentMethods}
            hasSideContent={viewModel.hasSideContent}
            calendarLabels={viewModel.calendarLabels}
          />

          <section className="class-detail__content-column flex flex-col gap-0">
            <div className="class-detail__desktop-intro-flow contents max-[992px]:hidden">
              <ClassDetailIntro item={item} titleLevel={titleLevel} />
              <ClassDetailLeadCopy item={item} />
            </div>
            <ClassDetailPriceDuration item={item} />
            <ClassDetailEnrollActions
              consultHref={viewModel.consultHref}
              consultLabel={viewModel.consultLabel}
            />
            <div className="class-detail__mobile-gallery hidden max-[992px]:block max-[992px]:w-[min(100%,680px)] max-[992px]:mx-auto max-[992px]:mb-[clamp(28px,6vw,40px)] max-[992px]:order-5">
              <ClassDetailGallery item={item} />
            </div>
            <ClassDetailBodySections
              item={item}
              showIncluded={viewModel.showIncluded}
              hasLearningContent={viewModel.hasLearningContent}
              hasParticipationContent={viewModel.hasParticipationContent}
              showProgram={viewModel.showProgram}
              programItems={viewModel.programItems}
            />
          </section>
        </div>
      </div>
    </section>
  );
}
