import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

// iPhone Safari bug: sheets could be dragged sideways because a date input overflowed its grid cell.
const css = readFileSync("app/globals.css", "utf8");
const rule = (sel: string) => css.match(new RegExp(`(^|\\n)${sel.replace(/[.[\]"()]/g, "\\$&")}\\s*\\{([^}]*)\\}`))?.[2] ?? "";

describe("no sideways scroll on phones", () => {
  it("two-column grid cells can shrink below their content", () => {
    expect(rule(".grid2")).toContain("minmax(0, 1fr) minmax(0, 1fr)");
  });
  it("inputs never exceed their cell; date inputs drop the native iOS look", () => {
    expect(rule("input, select")).toMatch(/min-width:\s*0/);
    expect(rule('input[type="date"]')).toMatch(/appearance:\s*none/);
  });
  it("sheets scroll only vertically", () => {
    const sheet = rule(".sheet");
    expect(sheet).toMatch(/overflow-x:\s*hidden/);
    expect(sheet).toMatch(/touch-action:\s*pan-y/);
  });
  it("the page itself has no horizontal overflow", () => {
    expect(rule("html, body")).toMatch(/overflow-x:\s*hidden/);
  });
});

describe("spec v14 D5: sources are plain text", () => {
  it("the last .src rule has no background and no pill radius", () => {
    const rules = [...css.matchAll(/(^|\n)\.src, \.src\.illustrative, \.src\.owner \{([^}]*)\}/g)];
    expect(rules.length).toBe(1);
    expect(rules[0][2]).toMatch(/background:\s*none/);
    expect(rules[0][2]).toMatch(/border-radius:\s*0/);
  });
});
