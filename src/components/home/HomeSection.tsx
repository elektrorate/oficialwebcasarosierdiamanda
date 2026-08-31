import type { ReactNode } from "react";
import { classNames } from "@/lib/utils";

export type HomeSectionBlock = "featured" | "gift";

export type HomeSectionProps = {
  id?: string;
  title: string;
  subtitle?: string;
  /** Appended as `{block}--{variant}` on the section root. */
  variant?: string;
  /** BEM block prefix for container/head/title (default `featured`). */
  block?: HomeSectionBlock;
  className?: string;
  children: ReactNode;
  /** Wrap children in the cards grid. Default `true`. Set `false` for carousels or custom layouts. */
  withGrid?: boolean;
  /** Editorial vertical rhythm for home page sections (FeaturedSection, gift). */
  editorialSpacing?: boolean;
  gridClassName?: string;
};

export function HomeSection({
  id,
  title,
  subtitle,
  variant,
  block = "featured",
  className,
  children,
  withGrid = true,
  editorialSpacing = false,
  gridClassName = "grid grid-cols-1 gap-x-0 gap-y-[clamp(32px,4vw,48px)] min-[641px]:grid-cols-2 min-[993px]:grid-cols-3",
}: HomeSectionProps) {
  const isGift = block === "gift";
  const sectionSpacing = isGift
    ? "pt-[clamp(64px,8vw,92px)] pb-[clamp(64px,8vw,88px)] max-[640px]:pt-[clamp(48px,12vw,64px)] max-[640px]:pb-[clamp(48px,12vw,64px)]"
    : variant === "classes"
      ? "pt-[clamp(72px,10vw,108px)] pb-[clamp(56px,7.5vw,80px)] max-[640px]:pt-[clamp(56px,14vw,80px)] max-[640px]:pb-[clamp(48px,12vw,64px)]"
      : "pt-[clamp(44px,5.5vw,60px)] pb-[clamp(56px,7.5vw,80px)] max-[640px]:pt-[clamp(36px,9vw,48px)] max-[640px]:pb-[clamp(48px,12vw,64px)]";

  return (
    <section
      id={id}
      className={classNames(
        "home-section bg-[#fbfaf6]",
        editorialSpacing && sectionSpacing,
        className,
      )}
    >
      <div
        className={classNames(
          "container mx-auto",
          isGift ? "max-w-[min(920px,94vw)]" : "max-w-276",
        )}
      >
        <header className="mb-[clamp(32px,4.2vw,42px)] text-center max-[640px]:mb-7">
          <h2 className="m-0 font-normal text-[clamp(20px,2.1vw,28px)] leading-[1.12] tracking-[0.03em] text-[#3f3f3f] uppercase text-balance">
            {title}
          </h2>
          {subtitle ? (
            <p className="m-0 mt-[clamp(4px,0.55vw,8px)] font-normal text-[clamp(13px,1.35vw,19px)] leading-[1.2] tracking-[0.03em] text-[#3f3f3f] uppercase text-balance">
              {subtitle}
            </p>
          ) : null}
        </header>
        {withGrid ? <div className={gridClassName}>{children}</div> : children}
      </div>
    </section>
  );
}
