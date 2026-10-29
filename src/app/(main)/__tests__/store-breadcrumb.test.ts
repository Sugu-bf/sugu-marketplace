/**
 * Audit 2026-10-29 (catalogue low finding): the breadcrumb of every store
 * page linked to /boutiques, a route that does not exist (404). The store
 * listing lives at /stores.
 */
import fs from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";

const mainDir = path.resolve(__dirname, "..");

function routeExists(href: string): boolean {
  return fs.existsSync(path.join(mainDir, href, "page.tsx"));
}

describe("store page breadcrumb", () => {
  it("links only to routes that exist", () => {
    const source = fs.readFileSync(path.join(mainDir, "store/[slug]/page.tsx"), "utf8");
    const hrefs = [...source.matchAll(/label: "[^"]+", href: "(\/[^"]*)"/g)].map((m) => m[1]);

    expect(hrefs).toContain("/stores");
    for (const href of hrefs) {
      expect(routeExists(href), href).toBe(true);
    }
  });
});
