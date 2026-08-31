import type { ReactNode } from "react";
import { NavbarGlobal } from "@/components/layout/NavbarGlobal";
import { PublicHeroContent, PublicHeroTitle } from "@/components/hero/PublicHeroContent";
import type { NavigationItem } from "@/data/types";
import { classNames } from "@/lib/utils";
import type { HeaderInternoProps } from "./headerInternoTypes";
import {
  buildHeaderInternoStyle,
  headerInternoScrollThresholds,
} from "./buildHeaderInternoStyle";

type MenuSettings = {
  headerLogoUrl: string;
  scrollMenuBackgroundColor: string;
  scrollMenuTextColor: string;
  scrollMenuIconColor: string;
  scrollMenuLogoTintEnabled: boolean;
  scrollMenuLogoTintColor: string;
};

type Props = HeaderInternoProps & {
  navigationItems: NavigationItem[];
  menu: MenuSettings;
};

function HeaderInternoTitleBlock({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: string;
  title?: string;
  children?: ReactNode;
}) {
  if (children) return <>{children}</>;
  if (!title) return null;
  return (
    <div>
      {eyebrow ? <p className="page-hero__eyebrow">{eyebrow}</p> : null}
      <h1 className="page-hero__title">{title}</h1>
    </div>
  );
}

export function HeaderInternoView(props: Props) {
  const {
    variant = "text",
    hero,
    eyebrow,
    title,
    height = "medium",
    overlayTitle = false,
    heroMenuTone,
    heroMenuColor,
    heroMenuScale,
    heroLogoPositionX,
    heroLogoPositionY,
    heroLogoWidth,
    heroLogoTabletPositionX,
    heroLogoTabletPositionY,
    heroLogoTabletWidth,
    heroLogoMobilePositionX,
    heroLogoMobilePositionY,
    heroLogoMobileWidth,
    heroMenuPositionY,
    heroMenuTabletPositionY,
    heroMenuMobilePositionY,
    className,
    children,
    navigationItems,
    menu,
  } = props;

  const style = buildHeaderInternoStyle(props);
  const thresholds = headerInternoScrollThresholds(props);
  const resolvedVariant = hero?.heroVariant ?? variant;
  const isImageLikeHero =
    resolvedVariant === "image" || resolvedVariant === "presentation";
  const isTextHero = resolvedVariant === "text" && (Boolean(hero) || overlayTitle);
  const titleContent = (
    <HeaderInternoTitleBlock eyebrow={eyebrow} title={title}>
      {children}
    </HeaderInternoTitleBlock>
  );
  const hasTitle = Boolean(children || title);
  const menuTone =
    heroMenuTone ?? hero?.heroMenuTone ?? (isImageLikeHero ? "light" : "dark");
  const effectiveHeroMenuColor =
    heroMenuColor ??
    hero?.heroMenuColor ??
    (menuTone === "light" ? "#ffffff" : "#403b36");

  const logoFromHero = hero
    ? {
        heroLogoPositionX: heroLogoPositionX ?? hero.heroLogoPositionX,
        heroLogoPositionY: heroLogoPositionY ?? hero.heroLogoPositionY,
        heroLogoWidth: heroLogoWidth ?? hero.heroLogoWidth,
        heroLogoTabletPositionX: heroLogoTabletPositionX ?? hero.heroLogoTabletPositionX,
        heroLogoTabletPositionY: heroLogoTabletPositionY ?? hero.heroLogoTabletPositionY,
        heroLogoTabletWidth: heroLogoTabletWidth ?? hero.heroLogoTabletWidth,
        heroLogoMobilePositionX: heroLogoMobilePositionX ?? hero.heroLogoMobilePositionX,
        heroLogoMobilePositionY: heroLogoMobilePositionY ?? hero.heroLogoMobilePositionY,
        heroLogoMobileWidth: heroLogoMobileWidth ?? hero.heroLogoMobileWidth,
        heroMenuPositionY: heroMenuPositionY ?? hero.heroMenuPositionY,
        heroMenuTabletPositionY: heroMenuTabletPositionY ?? hero.heroMenuTabletPositionY,
        heroMenuMobilePositionY: heroMenuMobilePositionY ?? hero.heroMenuMobilePositionY,
        heroMenuColor: effectiveHeroMenuColor,
        heroMenuScale: heroMenuScale ?? hero.heroMenuScale,
      }
    : {
        heroLogoPositionX,
        heroLogoPositionY,
        heroLogoWidth,
        heroLogoTabletPositionX,
        heroLogoTabletPositionY,
        heroLogoTabletWidth,
        heroLogoMobilePositionX,
        heroLogoMobilePositionY,
        heroLogoMobileWidth,
        heroMenuPositionY,
        heroMenuTabletPositionY,
        heroMenuMobilePositionY,
        heroMenuColor: effectiveHeroMenuColor,
        heroMenuScale,
      };

  return (
    <div style={style}>
      <header
        className={classNames(
          "header-interno page-hero header-interno--ready header-interno--center header-interno--overlay-warm",
          isImageLikeHero ? "header-interno--image-hero" : isTextHero && "header-interno--text-hero",
          resolvedVariant === "presentation" && "header-interno--presentation-hero",
          `header-interno--menu-${menuTone}`,
          `header-interno--${height}`,
          !hero && !overlayTitle && hasTitle && "page-hero--nav-only",
          className,
        )}
        data-header-height={height}
        data-header-alignment="center"
        data-header-overlay="warm"
      >
        <NavbarGlobal
          editorialScrollNav
          navigationItems={navigationItems}
          logoUrl={menu.headerLogoUrl}
          scrollMenuBackgroundColor={menu.scrollMenuBackgroundColor}
          scrollMenuTextColor={menu.scrollMenuTextColor}
          scrollMenuIconColor={menu.scrollMenuIconColor}
          scrollMenuLogoTintEnabled={menu.scrollMenuLogoTintEnabled}
          scrollMenuLogoTintColor={menu.scrollMenuLogoTintColor}
          scrollThreshold={thresholds.scrollThreshold}
          tabletScrollThreshold={thresholds.tabletScrollThreshold}
          mobileScrollThreshold={thresholds.mobileScrollThreshold}
          {...logoFromHero}
        />
        {hero && (hero.heroVariant === "image" || hero.heroVariant === "presentation") ? (
          <PublicHeroContent hero={hero} />
        ) : null}
        {hero && hero.heroVariant === "text" ? (
          <PublicHeroTitle
            hero={hero}
            title={hero.heroTitle || title || ""}
            subtitle={hero.heroSubtitle || eyebrow}
          />
        ) : null}
        {!hero && overlayTitle && hasTitle ? (
          <div className="header-interno__inner page-hero__inner container" aria-hidden="true">
            {titleContent}
          </div>
        ) : null}
        {!hero && !hasTitle ? (
          <div className="header-interno__inner page-hero__inner container" aria-hidden="true" />
        ) : null}
      </header>
      {!hero && !overlayTitle && hasTitle ? (
        <section
          className={classNames(
            "page-title-block page-title-block--center",
            variant === "text" && "page-title-block--typographic",
            `page-title-block--${height}`,
          )}
        >
          <div className="page-title-block__inner container">{titleContent}</div>
        </section>
      ) : null}
    </div>
  );
}
