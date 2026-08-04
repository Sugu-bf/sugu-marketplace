import { proxySitemap } from "@/lib/seo/sitemap-proxy";

export function GET() {
  return proxySitemap("sitemap.xml");
}
