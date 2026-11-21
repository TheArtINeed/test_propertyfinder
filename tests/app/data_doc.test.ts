import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { EVENT_NAMES } from "@/lib/events";

const ROOT = join(__dirname, "..", "..");
const doc = readFileSync(join(ROOT, "docs", "DATA.md"), "utf8");
const docEvents = [...new Set([...doc.matchAll(/`([a-z]+(?:_[a-z]+)+)`/g)].map((m) => m[1]))];

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) return sources(p);
    return /\.tsx?$/.test(f) ? [p] : [];
  });
}
const appCode = [...sources(join(ROOT, "app")), ...sources(join(ROOT, "lib"))]
  .filter((p) => !p.endsWith(join("lib", "events.ts")))
  .map((p) => readFileSync(p, "utf8"))
  .join("\n");

describe("docs/DATA.md metric tree", () => {
  it("names events", () => {
    expect(docEvents.length).toBeGreaterThan(10);
  });

  it.each(docEvents)("%s is a known event and is sent by the app", (name) => {
    expect(EVENT_NAMES as readonly string[]).toContain(name);
    expect(appCode).toContain(`"${name}"`);
  });

  it("states the one number and guardrails", () => {
    expect(doc).toMatch(/One number: owner month-2 retention/);
    expect(doc).toMatch(/must not drop \(guardrails\)/);
  });
});
