import type { ExperienceItem } from "@/data/types";

type Props = {
  item: ExperienceItem;
};

export function ClassDetailPriceDuration({ item }: Props) {
  const hasPrices = item.priceOptions.length > 0;
  const hasSchedule = item.schedule.length > 0;
  if (!hasPrices && !hasSchedule) return null;

  const durationTitle = item.durationSectionTitle?.trim() ?? "";
  const showDurationTitle = item.showDurationSectionTitle !== false && durationTitle.length > 0;
  const normalizedScheduleLabel = item.scheduleLabel?.trim().toLowerCase() ?? "";

  return (
    <section className="class-detail__facts class-detail__facts--fit" aria-label="Precio y horario">
      {hasPrices ? (
        <div className="class-detail__fact-block class-detail__fact-block--price">
          <h2>{item.priceSectionTitle || "Precio"}</h2>
          <div className="class-detail__price-list">
            {item.priceOptions.map((option, optionIndex) => (
              <div className="class-detail__price-row" key={`${option.label}-${optionIndex}`}>
                <span>{option.label}</span>
                <strong>{option.price}</strong>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {hasSchedule ? (
        <div className="class-detail__fact-block class-detail__fact-block--schedule">
          {showDurationTitle ? <h2>{durationTitle}</h2> : null}
          {item.schedule.length ? (
            <div className="class-detail__schedule">
              {item.schedule.map((schedule, scheduleIndex) => {
                const isScheduleHeading =
                  !showDurationTitle &&
                  normalizedScheduleLabel.length > 0 &&
                  schedule.day.trim().toLowerCase() === normalizedScheduleLabel;

                return (
                  <div className="class-detail__schedule-item" key={`${schedule.day}-${scheduleIndex}`}>
                    {isScheduleHeading ? (
                      <h2 className="class-detail__schedule-heading">{schedule.day}</h2>
                    ) : (
                      <h4>{schedule.day}</h4>
                    )}
                    {schedule.slots.map((slot, slotIndex) => (
                      <p key={`${slot}-${slotIndex}`}>{slot}</p>
                    ))}
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
