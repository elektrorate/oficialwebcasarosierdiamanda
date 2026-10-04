"use client";

import { useLayoutEffect, type RefObject } from "react";
import { dropdownHorizontalOffset } from "@/lib/navigation-ui";

export function useDesktopDropdownPosition(scopeRef: RefObject<HTMLElement | null>, openId: string | null) {
  useLayoutEffect(() => {
    if (!openId || !scopeRef.current) return;
    const dropdown = Array.from(scopeRef.current.querySelectorAll<HTMLElement>("[data-nav-dropdown]"))
      .find((element) => element.dataset.navDropdown === openId);
    if (!dropdown) return;

    const update = () => {
      // Measure the original anchor, not the previous viewport correction.
      dropdown.style.removeProperty("--nav-dropdown-shift-x");
      const box = dropdown.getBoundingClientRect();
      if (dropdown.hidden || !box.width) return;
      const offset = dropdownHorizontalOffset(box.left, box.width, document.documentElement.clientWidth);
      const scale = box.width / dropdown.offsetWidth;
      dropdown.style.setProperty("--nav-dropdown-shift-x", `${offset / scale}px`);
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, { passive: true });
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(update);
    observer?.observe(dropdown);
    observer?.observe(scopeRef.current);
    if (dropdown.parentElement) observer?.observe(dropdown.parentElement);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update);
      observer?.disconnect();
    };
  }, [openId, scopeRef]);
}
