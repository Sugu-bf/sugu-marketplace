/**
 * Audit 2026-10-29 (front low finding): the coming-soon page still loaded
 * Quicksand from fonts.googleapis.com (a request to Google on every visit,
 * outside the consent banner) while the site serves the font itself
 * (src/lib/fonts.ts, --font-quicksand).
 */
import fs from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";

const dir = path.resolve(__dirname, "..");
const read = (file: string) => fs.readFileSync(path.join(dir, file), "utf8");

describe("coming-soon fonts", () => {
  it("loads nothing from Google Fonts", () => {
    expect(read("ComingSoon.tsx")).not.toMatch(/fonts\.(googleapis|gstatic)\.com/);
    expect(read("ComingSoon.module.css")).not.toMatch(/fonts\.(googleapis|gstatic)\.com/);
  });

  it("uses the font the site serves", () => {
    const css = read("ComingSoon.module.css");
    expect(css).not.toContain("'Quicksand'");
    expect(css).toContain("var(--font-quicksand)");
  });
});
