"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import type { NavigationItem } from "@/data/types";
import { classNames } from "@/lib/utils";

type Props = {
  items: NavigationItem[];
  openHref: string | null;
  current: (href: string) => boolean;
  onOpen: (href: string) => void;
  onScheduleClose: () => void;
  onClose: () => void;
  className?: string;
};

export function ScrollDesktopNavList({
  items,
  openHref,
  current,
  onOpen,
  onScheduleClose,
  onClose,
  className,
}: Props) {
  if (!items.length) return null;

  return (
    <nav className={classNames("scroll-desktop-nav", className)} aria-label="Principal">
      <ul className="scroll-desktop-nav__list">
        {items.map((item) => {
          const open = openHref === item.href;
          const children = item.children?.filter((child) => child.visible) ?? [];
          return (
            <li
              className={classNames(
                "scroll-desktop-nav__item",
                children.length > 0 && "scroll-desktop-nav__item--has-children",
                open && "is-open",
              )}
              key={item.href}
              onMouseEnter={() => children.length > 0 && onOpen(item.href)}
              onMouseLeave={() => children.length > 0 && onScheduleClose()}
              onFocus={() => children.length > 0 && onOpen(item.href)}
            >
              <Link
                className="scroll-desktop-nav__link"
                href={item.href}
                target={item.target}
                rel={item.target === "_blank" ? "noopener noreferrer" : undefined}
                aria-current={current(item.href) ? "page" : undefined}
                onClick={onClose}
              >
                {item.label}
                {children.length > 0 ? (
                  <span className="scroll-desktop-nav__plus" aria-hidden="true">
                    +
                  </span>
                ) : null}
              </Link>
              {children.length > 0 ? (
                <ul
                  className="scroll-desktop-submenu"
                  role="menu"
                  hidden={!open}
                  aria-hidden={!open}
                >
                  {children.map((child) => (
                    <li className="scroll-desktop-submenu__item" role="none" key={child.href}>
                      <Link
                        className="scroll-desktop-submenu__link"
                        href={child.href}
                        target={child.target}
                        rel={child.target === "_blank" ? "noopener noreferrer" : undefined}
                        role="menuitem"
                        aria-current={current(child.href) ? "page" : undefined}
                        onClick={onClose}
                      >
                        {child.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

type LogoProps = {
  logoUrl: string;
  useTint: boolean;
  tintStyle: CSSProperties;
  onNavigate: () => void;
};

export function ScrollStickyLogo({ logoUrl, useTint, tintStyle, onNavigate }: LogoProps) {
  return (
    <Link
      className="mobile-scroll-nav__logo"
      href="/#hero"
      aria-label="Casa Rosier"
      onClick={onNavigate}
    >
      {useTint ? (
        <span className="mobile-scroll-nav__logo-tint" style={tintStyle} aria-hidden="true" />
      ) : (
        <img className="mobile-scroll-nav__logo-image" src={logoUrl} alt="Casa Rosier" />
      )}
    </Link>
  );
}
