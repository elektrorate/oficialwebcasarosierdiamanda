import type { ExperienceItem } from "@/data/types";

type Props = {
  item: ExperienceItem;
};

export function ClassDetailPriceDuration({ item }: Props) {
  const hasPrices = item.priceOptions.length > 0;
  const hasDuration = Boolean(item.duration?.trim()) || item.schedule.length > 0;
  if (!hasPrices && !hasDuration) return null;

  return (
    <section className="class-detail__facts class-detail__facts--fit mt-7.5 grid grid-cols-2 gap-[24px] items-start h-fit max-[992px]:grid-cols-1 max-[640px]:grid-cols-1" aria-label="Precio y duracion">
      {hasPrices ? (
        <div className="class-detail__fact-block p-[22px_24px] bg-[#fffdf9] rounded-2xl border border-[rgba(147,124,97,0.14)] max-[992px]:p-[18px_19px]">
          <h2 className="m-0 mb-3 text-[#3d3935] text-[20px]! [font-family:var(--font-display)] uppercase tracking-[0.03em] max-[992px]:text-[18px]! max-[640px]:text-[16px]!">Precio</h2>
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
        <div className="class-detail__fact-block p-[22px_24px] bg-[#fffdf9] rounded-2xl border border-[rgba(147,124,97,0.14)] max-[992px]:p-[18px_19px]">
          <h2 className="m-0 mb-3 text-[#3d3935] text-[20px]! [font-family:var(--font-display)] uppercase tracking-[0.03em] max-[992px]:text-[18px]! max-[640px]:text-[16px]!">Duracion</h2>
          {item.duration?.trim() ? <p className="class-detail__duration m-0 mb-3.5 text-[#b87352] text-[13px]! font-normal leading-[1.45]">{item.duration}</p> : null}
          {item.schedule.length ? (
            <div className="class-detail__schedule">
              {item.schedule.map((schedule, scheduleIndex) => (
                <div className="class-detail__schedule-item" key={`${schedule.day}-${scheduleIndex}`}>
                  <h4 className="m-0 mb-1.5 text-[11px] font-medium tracking-[0.12em] uppercase text-[#8a827a]">{schedule.day}</h4>
                  {schedule.slots.map((slot, slotIndex) => (
                    <p className="class-detail__schedule-item m-0 mb-[4px] text-[#68615a] text-[13px]! leading-normal font-light [font-family:var(--font-menu)]" key={`${slot}-${slotIndex}`}>{slot}</p>
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
