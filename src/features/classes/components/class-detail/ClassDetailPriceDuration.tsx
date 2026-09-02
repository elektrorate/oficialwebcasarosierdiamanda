import type { ExperienceItem } from "@/data/types";

type Props = {
  item: ExperienceItem;
};

export function ClassDetailPriceDuration({ item }: Props) {
  const hasPrices = item.priceOptions.length > 0;
  const hasDuration = Boolean(item.duration?.trim()) || item.schedule.length > 0;
  if (!hasPrices && !hasDuration) return null;

  const durationTitle =
    item.durationSectionTitle === undefined ? "Duracion" : item.durationSectionTitle;
  const showDurationTitle = item.showDurationSectionTitle !== false && Boolean(durationTitle);

  return (
    <section className="class-detail__facts class-detail__facts--fit" aria-label="Precio y duración">
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

      {hasDuration ? (
        <div className="class-detail__fact-block class-detail__fact-block--schedule">
          {showDurationTitle ? <h2>{durationTitle}</h2> : null}
          {item.duration?.trim() ? <p className="class-detail__duration">{item.duration}</p> : null}
          {item.schedule.length ? (
            <div className="class-detail__schedule">
              {item.schedule.map((schedule, scheduleIndex) => (
                <div className="class-detail__schedule-item" key={`${schedule.day}-${scheduleIndex}`}>
                  <h4>{schedule.day}</h4>
                  {schedule.slots.map((slot, slotIndex) => (
                    <p key={`${slot}-${slotIndex}`}>{slot}</p>
                  ))}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
