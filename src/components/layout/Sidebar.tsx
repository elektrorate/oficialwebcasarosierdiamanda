"use client";

import { useState } from "react";
import Link from "@/components/admin/AdminLink";
import { adminSections } from "@/lib/admin/navigation";
import type { AdminNavLink } from "@/lib/admin/navigation";
import { usePathname, useSearchParams } from "next/navigation";
import type { AdminRole } from "@/lib/auth/roles";

interface SidebarProps {
  userName: string;
  userEmail: string;
  role: AdminRole;
}

function splitLocation(location: string) {
  const [pathname, query = ""] = location.split("?");
  return { pathname, searchParams: new URLSearchParams(query) };
}

function matchScore(location: string, candidate: string) {
  const current = splitLocation(location);
  const target = splitLocation(candidate);
  const samePath = current.pathname === target.pathname;
  const nestedPath = current.pathname.startsWith(`${target.pathname}/`);
  if (!samePath && !nestedPath) return -1;

  for (const [key, value] of target.searchParams) {
    if (current.searchParams.get(key) !== value) return -1;
  }

  return target.pathname.length + (target.searchParams.size > 0 ? 1_000 : 0);
}

function getActiveChild(children: AdminNavLink[], location: string) {
  let active: AdminNavLink | null = null;
  let bestScore = -1;

  for (const child of children) {
    const candidates = child.activePaths?.length ? child.activePaths : [child.href];
    const score = Math.max(...candidates.map((candidate) => matchScore(location, candidate)));
    if (score > bestScore) {
      active = score >= 0 ? child : active;
      bestScore = score;
    }
  }

  return active;
}

export default function Sidebar({ userName, userEmail, role }: SidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  const location = `${pathname}${query ? `?${query}` : ""}`;
  const [expanded, setExpanded] = useState<string[]>([]);
  const [collapsedActive, setCollapsedActive] = useState<string[]>([]);
  const userInitial = (userName || userEmail || "A").trim().charAt(0).toUpperCase();
  const visibleSections = role === "admin"
    ? adminSections
    : adminSections.filter((section) => section.href !== "/admin/users");

  const toggleGroup = (key: string) => {
    const section = visibleSections.find((item) => item.label === key);
    const active = Boolean(getActiveChild(section?.children ?? [], location));

    if (active) {
      setCollapsedActive((previous) =>
        previous.includes(key) ? previous.filter((item) => item !== key) : [...previous, key],
      );
      return;
    }

    setExpanded((previous) =>
      previous.includes(key) ? previous.filter((item) => item !== key) : [...previous, key],
    );
  };

  return (
    <aside className="admin-sidebar">
      <header className="admin-sidebar__header">
        <div className="admin-sidebar__avatar-wrap">
          <div className="admin-sidebar__avatar">{userInitial}</div>
          <span className="admin-sidebar__online" />
        </div>
        <div className="admin-sidebar__user">
          <span title={userName}>{userName}</span>
          <small title={userEmail}>{userEmail}</small>
          <a
            href={process.env.NEXT_PUBLIC_SITE_URL || "/"}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex items-center gap-1 text-label-sm font-bold text-[#0b1c30] hover:underline"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>open_in_new</span>
            Ver web
          </a>
        </div>
      </header>

      <nav className="admin-sidebar__nav" aria-label="Navegación administrativa">
        <div className="admin-sidebar__nav-list">
          {visibleSections.map((section) => {
            const children = section.children ?? [];
            const activeChild = getActiveChild(children, location);
            const childActive = Boolean(activeChild);
            const isOpen = childActive
              ? !collapsedActive.includes(section.label)
              : expanded.includes(section.label);

            if (section.href) {
              const active = matchScore(location, section.href) >= 0;
              return (
                <Link
                  key={section.label}
                  href={section.href}
                  className={`admin-sidebar__item ${active ? "admin-sidebar__item--active" : ""}`.trim()}
                  aria-current={active ? "page" : undefined}
                >
                  <span className="material-symbols-outlined">{section.icon}</span>
                  <span>{section.label}</span>
                </Link>
              );
            }

            return (
              <div key={section.label}>
                <button
                  type="button"
                  onClick={() => toggleGroup(section.label)}
                  className={`admin-sidebar__item admin-sidebar__item--button ${childActive ? "admin-sidebar__item--active" : ""}`.trim()}
                  aria-expanded={isOpen}
                >
                  <div className="admin-sidebar__item-label">
                    <span className="material-symbols-outlined">{section.icon}</span>
                    <span>{section.label}</span>
                  </div>
                  <span
                    className="material-symbols-outlined admin-sidebar__chevron"
                    style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                  >
                    expand_more
                  </span>
                </button>
                <div className={`admin-sidebar__submenu-wrap ${isOpen ? "admin-sidebar__submenu-wrap--open" : ""}`.trim()}>
                  <div className="admin-sidebar__submenu">
                    {children.map((child) => {
                      const active = activeChild?.href === child.href;
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={`admin-sidebar__submenu-link ${active ? "admin-sidebar__submenu-link--active" : ""}`.trim()}
                          aria-current={active ? "page" : undefined}
                        >
                          {child.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </nav>

    </aside>
  );
}
