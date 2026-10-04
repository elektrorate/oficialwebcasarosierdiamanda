import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import { createElement, type ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";
import type { NavigationItem } from "../src/data/types.ts";
import * as navigationUI from "../src/lib/navigation-ui.ts";
import type { IdentifiedNavigationItem } from "../src/lib/navigation-ui.ts";

const { identifyNavigationItems, dropdownHorizontalOffset } = navigationUI;
const require = createRequire(import.meta.url);

function item(overrides: Partial<NavigationItem> = {}): NavigationItem {
  return { label: "Clases", href: "/cursos", order: 0, visible: true, ...overrides };
}

function allIds(items: IdentifiedNavigationItem[]): string[] {
  return items.flatMap((entry) => [entry.id, ...allIds(entry.children ?? [])]);
}

test("roots sharing a canonical href preserve their distinct CMS identities", () => {
  const result = identifyNavigationItems([
    item({ id: "cms-classes", label: "Clases" }),
    item({ id: "cms-courses", label: "CURSOS" }),
  ]);
  assert.equal(result[0].href, result[1].href);
  assert.deepEqual(result.map((entry) => entry.id), ["cms-classes", "cms-courses"]);
});

test("existing root and child IDs survive renames, URL changes, reordering and prefixes", () => {
  const original = [
    item({ id: "classes", children: [item({ id: "regular" }), item({ id: "intensive" })] }),
    item({ id: "courses", order: 1 }),
  ];
  const before = identifyNavigationItems(original);
  const after = identifyNavigationItems([
    { ...original[1], label: "Renamed courses", href: "/new-courses", order: 0 },
    { ...original[0], label: "Renamed classes", href: "/new-classes", order: 1,
      children: original[0].children!.slice().reverse().map((child) => ({
        ...child, label: "Renamed child", href: "/new-child",
      })),
    },
  ], "different-prefix");
  assert.deepEqual(before.map((entry) => entry.id), ["classes", "courses"]);
  assert.deepEqual(after.map((entry) => entry.id), ["courses", "classes"]);
  assert.deepEqual(after[1].children!.map((entry) => entry.id), ["intensive", "regular"]);
  assert.equal(after[1].label, "Renamed classes");
  assert.equal(after[1].href, "/new-classes");
});

test("positional fallbacks are unique across duplicate roots, children and deeper descendants", () => {
  const input = [
    item({ children: [item(), item({ children: [item()] })] }),
    item({ children: [item(), item()] }),
    item({ id: "persisted", children: [item(), item({ id: "persisted-child" })] }),
  ];
  const result = identifyNavigationItems(input);
  const ids = allIds(result);
  assert.equal(ids.length, 10);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(ids.every((id) => id.length > 0));
  assert.ok(ids.filter((id) => !id.startsWith("persisted")).every((id) => id.startsWith("navigation")));
  assert.deepEqual(allIds(identifyNavigationItems(input)), ids);

  const custom = allIds(identifyNavigationItems(input, "test-menu"));
  assert.ok(custom.filter((id) => !id.startsWith("persisted")).every((id) => id.startsWith("test-menu")));
  assert.equal(new Set(custom).size, custom.length);
  assert.equal(result[2].id, "persisted");
  assert.equal(result[2].children![1].id, "persisted-child");

  const renamed = input.map((entry) => ({ ...entry, label: "New label", href: "/new-url" }));
  assert.deepEqual(allIds(identifyNavigationItems(renamed)), ids);
  const swapped = input.slice(0, 2).reverse();
  assert.deepEqual(identifyNavigationItems(swapped).map((entry) => entry.id), result.slice(0, 2).map((entry) => entry.id));
});

test("identification handles an empty tree and never mutates input arrays or objects", () => {
  assert.deepEqual(identifyNavigationItems([]), []);
  const input = [item({
    id: "root", target: "_blank", linked_entity_id: "entity", visible: false,
    children: [item({ children: [item()] }), item({ id: "child", order: 7 })],
  })];
  const snapshot = structuredClone(input);
  function freezeTree(entries: NavigationItem[]) {
    for (const entry of entries) {
      if (entry.children) freezeTree(entry.children);
      Object.freeze(entry);
    }
    Object.freeze(entries);
  }
  freezeTree(input);
  const result = identifyNavigationItems(input);
  assert.deepEqual(input, snapshot);
  assert.notEqual(result, input);
  assert.equal(result.length, 1);
  assert.equal(result[0].visible, false);
  assert.equal(result[0].target, "_blank");
  assert.equal(result[0].linked_entity_id, "entity");
  assert.equal(result[0].children!.length, 2);
  assert.equal(result[0].children![1].order, 7);
});

for (const { label, left, width, viewport, margin, expected } of [
  { label: "already inside", left: 100, width: 200, viewport: 1025, expected: 0 },
  { label: "exact left margin", left: 16, width: 200, viewport: 1025, expected: 0 },
  { label: "exact right margin", left: 809, width: 200, viewport: 1025, expected: 0 },
  { label: "left overflow", left: -40, width: 200, viewport: 1025, expected: 56 },
  { label: "left margin deficit", left: 15, width: 200, viewport: 1025, expected: 1 },
  { label: "right overflow", left: 950, width: 200, viewport: 1025, expected: -141 },
  { label: "right margin deficit", left: 810, width: 200, viewport: 1025, expected: -1 },
  { label: "fractional layout", left: 810.5, width: 200.25, viewport: 1025, expected: -1.75 },
  { label: "fits full available width", left: 0, width: 993, viewport: 1025, expected: 16 },
  { label: "custom margin", left: 800, width: 200, viewport: 1025, margin: 32, expected: -7 },
  { label: "zero margin", left: -8, width: 200, viewport: 1025, margin: 0, expected: 8 },
]) {
  test(`dropdown horizontal offset: ${label}`, () => {
    const shift = margin === undefined
      ? dropdownHorizontalOffset(left, width, viewport)
      : dropdownHorizontalOffset(left, width, viewport, margin);
    assert.equal(shift, expected);
    assert.ok(left + shift >= (margin ?? 16));
    assert.ok(left + shift + width <= viewport - (margin ?? 16));
    assert.equal(dropdownHorizontalOffset(left + shift, width, viewport, margin), 0);
  });
}

type DesktopProps = {
  items: IdentifiedNavigationItem[];
  openId: string | null;
  current: (href: string) => boolean;
  onOpen: (id: string) => void;
  onScheduleClose: (id: string) => void;
  onClose: () => void;
  className?: string;
};

// Evaluate only the UI module, with no Next router, CMS or database access.
function loadDesktopList(): ComponentType<DesktopProps> {
  const source = readFileSync(new URL("../src/components/layout/scroll-nav/ScrollDesktopNavList.tsx", import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
    },
  }).outputText;
  const exports: { ScrollDesktopNavList?: ComponentType<DesktopProps> } = {};
  const dependencies: Record<string, unknown> = {
    "next/link": { __esModule: true, default: (props: Record<string, unknown>) => createElement("a", props) },
    "@/lib/utils": { classNames: (...values: unknown[]) => values.filter(Boolean).join(" ") },
    "@/lib/navigation-ui": navigationUI,
  };
  // SSR does not run positioning effects; its DOM geometry is checked by the E2E script.
  const ast = ts.createSourceFile("ScrollDesktopNavList.tsx", source, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TSX);
  for (const statement of ast.statements) {
    if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) continue;
    const bindings = statement.importClause?.namedBindings;
    if (!bindings || !ts.isNamedImports(bindings)) continue;
    for (const binding of bindings.elements) {
      const exportedName = binding.propertyName?.text ?? binding.name.text;
      if (exportedName === "useDesktopDropdownPosition") {
        const name = statement.moduleSpecifier.text;
        dependencies[name] = Object.assign({}, dependencies[name], { useDesktopDropdownPosition: () => {} });
      }
    }
  }
  new Function("require", "exports", compiled)((name: string) => {
    if (name in dependencies) return dependencies[name];
    if (["react", "react/jsx-runtime"].includes(name)) return require(name);
    throw new Error(`Unmocked UI dependency: ${name}`);
  }, exports);
  assert.ok(exports.ScrollDesktopNavList);
  return exports.ScrollDesktopNavList;
}

for (const openId of ["classes", "courses", null, "missing-id"]) {
  test(`desktop SSR opens only the selected identity for a shared href (${openId})`, () => {
    const items = identifyNavigationItems([
      item({ id: "classes", children: [item({ id: "regular", label: "Regular" }), item({ id: "hidden", label: "Hidden child", visible: false })] }),
      item({ id: "courses", label: "CURSOS", children: [item({ id: "course", label: "Course" })] }),
    ]);
    const markup = renderToStaticMarkup(createElement(loadDesktopList(), {
      items, openId, current: () => false, onOpen: () => {},
      onScheduleClose: () => {}, onClose: () => {}, className: "test-nav",
    }));
    assert.match(markup, /class="[^"]*test-nav/);
    assert.ok(markup.includes('data-menu-id="classes"'));
    assert.ok(markup.includes('data-menu-id="courses"'));
    const menus = Array.from(markup.matchAll(/<ul\b([^>]*)>/g))
      .map((match) => match[1]).filter((attributes) => /\bdata-nav-dropdown=/.test(attributes));
    assert.equal(menus.length, 2);
    assert.ok(menus.every((attributes) => /\brole="menu"/.test(attributes)));
    const open = menus.filter((attributes) => !/(?:^|\s)hidden(?:\s|=|$)/.test(attributes));
    assert.equal(open.length, openId === "classes" || openId === "courses" ? 1 : 0);
    if (open.length) {
      assert.ok(open[0].includes(`data-nav-dropdown="${openId}"`));
      assert.ok(!open[0].includes('aria-hidden="true"'));
    }
    assert.equal((markup.match(/role="menuitem"/g) ?? []).length, 2);
    assert.ok(!markup.includes("Hidden child"));
  });
}
