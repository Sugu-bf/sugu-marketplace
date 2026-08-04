import { proxySitemap } from "@/lib/seo/sitemap-proxy";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ file: string }> },
) {
  const { file } = await params;
  return proxySitemap(file);
}
