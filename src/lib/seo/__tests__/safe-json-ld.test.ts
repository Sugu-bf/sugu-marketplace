/**
 * P0-3 (audit 2026-10-29): script injection through the JSON-LD blocks.
 *
 * A seller short description `&lt;/script&gt;&lt;img src=x onerror=…&gt;` was
 * decoded by stripHtml, then written by JSON.stringify inside
 * <script type="application/ld+json">: the tag closed and the rest ran.
 */
import { describe, it, expect } from "vitest";
import { safeJsonLd } from "../structured-data";
import { stripHtml } from "@/lib/html-utils";

describe("safeJsonLd", () => {
  it("never writes a character that can close the script tag or open markup", () => {
    const data = { name: "</script><img src=x onerror=alert(1)>", note: "a & b \u2028 \u2029 <!--" };

    const out = safeJsonLd(data);

    expect(out).not.toMatch(/[<>&\u2028\u2029]/);
    expect(out.toLowerCase()).not.toContain("</script");
    expect(JSON.parse(out)).toEqual(data);
  });

  it("serializes arrays, as the product page sends two schemas", () => {
    expect(JSON.parse(safeJsonLd([{ a: "<b>" }, { c: 1 }]))).toEqual([{ a: "<b>" }, { c: 1 }]);
  });
});

describe("stripHtml", () => {
  it("does not turn encoded markup back into markup", () => {
    const text = stripHtml("&lt;/script&gt;&lt;img src=x onerror=alert(1)&gt;Pagne", 500);

    expect(text).not.toMatch(/[<>]/);
    expect(text).toContain("Pagne");
  });

  it("decodes the text entities once", () => {
    expect(stripHtml("<p>Tom &amp; Jerry &quot;bio&quot; &amp;lt;</p>")).toBe('Tom & Jerry "bio" &lt;');
  });
});
