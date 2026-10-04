"use client";

import Link from "next/link";
import { useId, useRef, type CSSProperties } from "react";
import type { IdentifiedNavigationItem } from "@/lib/navigation-ui";
import { classNames } from "@/lib/utils";
import { useDesktopDropdownPosition } from "../useDesktopDropdownPosition";

type Props = {
  items: IdentifiedNavigationItem[];
  openId: string | null;
  current: (href: string) => boolean;
  onOpen: (id: string) => void;
  onScheduleClose: (id: string) => void;
  onClose: () => void;
  className?: string;
};

export function ScrollDesktopNavList({
  items,
  openId,
  current,
  onOpen,
  onScheduleClose,
  onClose,
  className,
}: Props) {
  const navRef = useRef<HTMLElement>(null);
  const idPrefix = useId();
  useDesktopDropdownPosition(navRef, openId);
  if (!items.length) return null;

  return (
    <nav ref={navRef} className={classNames("scroll-desktop-nav", className)} aria-label="Principal">
      <ul className="scroll-desktop-nav__list">
        {items.map((item) => {
          const open = openId === item.id;
          const submenuId = `${idPrefix}-${item.id}`;
          const children = item.children?.filter((child) => child.visible) ?? [];
          return (
            <li
              className={classNames(
                "scroll-desktop-nav__item",
                children.length > 0 && "scroll-desktop-nav__item--has-children",
                open && "is-open",
              )}
              key={item.id}
              data-menu-id={item.id}
              onMouseEnter={() => children.length > 0 && onOpen(item.id)}
              onMouseLeave={(event) => {
                if (children.length && !event.currentTarget.contains(document.activeElement)) onScheduleClose(item.id);
              }}
              onFocus={() => children.length > 0 && onOpen(item.id)}
              onBlur={(event) => {
                const next = event.relatedTarget;
                if (children.length && !(next instanceof Node && event.currentTarget.contains(next)) && !event.currentTarget.matches(":hover")) onScheduleClose(item.id);
              }}
            >
              <Link
                className="scroll-desktop-nav__link"
                href={item.href}
                target={item.target}
                rel={item.target === "_blank" ? "noopener noreferrer" : undefined}
                aria-current={current(item.href) ? "page" : undefined}
                aria-expanded={children.length ? open : undefined}
                aria-controls={children.length ? submenuId : undefined}
                aria-haspopup={children.length ? "menu" : undefined}
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
                  id={submenuId}
                  data-nav-dropdown={item.id}
                  role="menu"
                  hidden={!open}
                  aria-hidden={!open}
                >
                  {children.map((child) => (
                    <li className="scroll-desktop-submenu__item" role="none" key={child.id}>
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
