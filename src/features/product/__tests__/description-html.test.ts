// @vitest-environment jsdom
/**
 * P0-2 (audit 2026-10-29): stored XSS through the product description.
 *
 * The former formatter rebuilt <img> tags from untrusted text without
 * escaping `alt`, and trusted any host ending with "sugu.pro". Each payload
 * below came out of it with an active event handler or a foreign picture.
 */
import { describe, it, expect } from "vitest";
import { allowedImageUrl, formatDescriptionHtml } from "../utils/description-html";

function render(html: string): HTMLDivElement {
  const root = document.createElement("div");
  root.innerHTML = html;
  return root;
}

function expectInert(html: string) {
  const root = render(html);
  for (const el of Array.from(root.querySelectorAll("*"))) {
    for (const attr of Array.from(el.attributes)) {
      expect(attr.name.startsWith("on"), `${el.tagName} ${attr.name}`).toBe(false);
      expect(attr.name).not.toBe("style");
    }
    if (el.tagName === "IMG") {
      expect(new URL(el.getAttribute("src") ?? "").hostname).toBe("cdn.sugu.pro");
    }
  }
  expect(root.querySelector("script, iframe, svg, object, embed, style")).toBeNull();
}

const payloads = [
  '<img src="https://cdn.sugu.pro/x.png" alt="a"onerror="alert(1)">',
  '<span title="a"onmouseover="alert(1)">survol</span>',
  '<p style="position:fixed;inset:0;z-index:99">Payez par WhatsApp</p>',
  '<img src="https://evilsugu.pro/x.png" alt="e">',
  '<img src=\'https://evil.example/x.png\' alt="single quotes">',
  '<p title="https://cdn.sugu.pro/a.png onmouseover=alert(1) x">t</p>',
  '<svg onload="alert(1)"></svg>',
  '<a href="javascript:alert(1)">lien</a>',
  "<!--><img src=x onerror=alert(1)>-->",
];

describe("formatDescriptionHtml — sanitized HTML of the API", () => {
  it.each(payloads)("renders %s without anything active", (payload) => {
    expectInert(formatDescriptionHtml(payload));
  });

  it("keeps the text of a refused markup, as text", () => {
    const html = formatDescriptionHtml('<p style="color:red">Pagne &amp; boubou</p>');
    expect(html).toBe("<p>Pagne &amp; boubou</p>");
  });

  it("renders the formatting tags and the CDN pictures it expects as they are", () => {
    const clean =
      '<h2>Tailles</h2><p>Fait <strong>main</strong></p><img src="https://cdn.sugu.pro/s/a.png" alt="Broderie">'
      + '<table><tbody><tr><th colspan="1" rowspan="1">Taille</th></tr></tbody></table>';
    expect(formatDescriptionHtml(clean)).toBe(clean);
  });
});

describe("formatDescriptionHtml — plain text", () => {
  it("escapes the alt of a markdown picture", () => {
    const html = formatDescriptionHtml('![x"/onerror=alert(1)//](https://cdn.sugu.pro/media/42)');
    expectInert(html);
    const img = render(html).querySelector("img");
    expect(img?.getAttribute("src")).toBe("https://cdn.sugu.pro/media/42");
    expect(img?.getAttribute("alt")).toBe('x"/onerror=alert(1)//');
  });

  it("escapes a short description used as fallback, and builds pictures only from the CDN", () => {
    const html = formatDescriptionHtml("", '<img src=x onerror=alert(1)>\n\nhttps://cdn.sugu.pro/a.png https://evilsugu.pro/b.png');
    expectInert(html);
    const root = render(html);
    expect(root.textContent).toContain("<img src=x onerror=alert(1)>");
    expect(root.querySelectorAll("img")).toHaveLength(1);
  });

  it("turns paragraphs and line breaks into markup", () => {
    expect(formatDescriptionHtml("", "Ligne 1\nLigne 2\n\nAutre")).toBe("<p>Ligne 1<br/>Ligne 2</p><p>Autre</p>");
  });

  it("returns nothing for an empty description", () => {
    expect(formatDescriptionHtml(undefined, "")).toBe("");
  });
});

describe("allowedImageUrl", () => {
  it.each([
    ["https://cdn.sugu.pro/a.png", "https://cdn.sugu.pro/a.png"],
    ["https://evilsugu.pro/a.png", null],
    ["https://cdn.sugu.pro.evil.com/a.png", null],
    ["http://cdn.sugu.pro/a.png", null],
    ["https://user@cdn.sugu.pro/a.png", null],
    ["javascript:alert(1)", null],
    ["/relative.png", null],
  ])("%s → %s", (url, expected) => {
    expect(allowedImageUrl(url)).toBe(expected);
  });
});
