import { SITE_URL } from "@/lib/constants";
import { API_BASE_URL } from "@/lib/api/config";
import { comingSoonSitemapPaths, isComingSoon } from "@/lib/coming-soon";

const SITEMAP_FILE = /^sitemap(?:-[a-z0-9-]+)?\.xml$/;

const fallbackPaths = [
  "/",
  "/acheter",
  "/stores",
  "/fournisseurs",
  "/vendeurs",
  "/agences-de-livraison",
  "/coursiers",
  "/sugupay",
  "/blog",
  "/help",
  "/conditions-generales",
  "/politique-de-confidentialite",
  "/politique-livraison-retours",
  "/politique-anti-fraude",
] as const;

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function urlsetFrom(paths: readonly string[]): string {
  const lastModified = new Date().toISOString();
  const urls = paths
    .map((path) => `  <url>\n    <loc>${escapeXml(`${SITE_URL}${path === "/" ? "" : path}`)}</loc>\n    <lastmod>${lastModified}</lastmod>\n  </url>`)
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
}

function xmlResponse(xml: string, status = 200): Response {
  return new Response(xml, {
    status,
    headers: {
      "Content-Type": "application/xml; charset=UTF-8",
      // Never cache an error for an hour: a transient backend blip would keep
      // Search Console looking at a 503 long after the backend recovered.
      "Cache-Control":
        status === 200
          ? "public, s-maxage=3600, stale-while-revalidate=86400"
          : "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function proxySitemap(file: string): Promise<Response> {
  if (!SITEMAP_FILE.test(file)) {
    return xmlResponse("<?xml version=\"1.0\" encoding=\"UTF-8\"?><error>Not found</error>", 404);
  }

  // While the wall is up the catalogue redirects to "/". Advertising those URLs
  // would hand Google a sitemap made almost entirely of redirects, so we serve
  // only what the wall actually lets through.
  if (isComingSoon()) {
    return file === "sitemap.xml"
      ? xmlResponse(urlsetFrom(comingSoonSitemapPaths()))
      : xmlResponse(
          "<?xml version=\"1.0\" encoding=\"UTF-8\"?><error>Not found</error>",
          404,
        );
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/public/seo/sitemaps/${encodeURIComponent(file)}`,
      {
        headers: { Accept: "application/xml" },
        next: { revalidate: 3600 },
      },
    );

    if (response.ok) {
      return xmlResponse(await response.text());
    }
  } catch {
    // Root fallback below keeps Search Console operational during a backend
    // rollout or before the first scheduled catalogue generation.
  }

  if (file === "sitemap.xml") {
    return xmlResponse(urlsetFrom(fallbackPaths));
  }

  return xmlResponse("<?xml version=\"1.0\" encoding=\"UTF-8\"?><error>Sitemap unavailable</error>", 503);
}
