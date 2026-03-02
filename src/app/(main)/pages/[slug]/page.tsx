import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SITE_URL, SEO } from "@/lib/constants";
import { API_BASE_URL } from "@/lib/api/config";

const API_BASE = `${API_BASE_URL}/v1`;

interface CmsPageData {
  id: string;
  title: string;
  slug: string;
  template_key: string;
  published_at: string;
  updated_at: string;
  seo: {
    title: string;
    description: string | null;
    noindex: boolean;
    canonical_url: string | null;
    og_image_url: string | null;
  };
  hero: {
    url: string;
    thumb_url: string;
    alt: string;
  } | null;
  content_format: string;
  content: string;
}

interface CmsApiResponse {
  page: CmsPageData;
  meta: { cache_ttl: number };
}

async function fetchCmsPage(slug: string): Promise<CmsPageData | null> {
  try {
    const res = await fetch(`${API_BASE}/public/pages/${slug}`, {
      next: { revalidate: 300 }, // ISR: revalidate every 5 minutes
    });

    if (!res.ok) return null;

    const data: CmsApiResponse = await res.json();
    return data.page;
  } catch {
    return null;
  }
}

// ─── Dynamic Metadata ────────────────────────────────────

type MetadataProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: MetadataProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await fetchCmsPage(slug);

  if (!page) {
    return { title: "Page introuvable" };
  }

  const title = page.seo.title || page.title;
  const description = page.seo.description || SEO.defaultDescription;

  return {
    title,
    description,
    robots: page.seo.noindex ? { index: false, follow: false } : undefined,
    alternates: page.seo.canonical_url
      ? { canonical: page.seo.canonical_url }
      : { canonical: `${SITE_URL}/pages/${page.slug}` },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/pages/${page.slug}`,
      type: "article",
      ...(page.seo.og_image_url
        ? { images: [{ url: page.seo.og_image_url, width: 1200, height: 630 }] }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(page.seo.og_image_url ? { images: [page.seo.og_image_url] } : {}),
    },
  };
}

// ─── Page Component ──────────────────────────────────────

type PageProps = { params: Promise<{ slug: string }> };

export default async function CmsPage({ params }: PageProps) {
  const { slug } = await params;
  const page = await fetchCmsPage(slug);

  if (!page) {
    notFound();
  }

  return (
    <article className="min-h-screen">
      {/* Hero Image */}
      {page.hero && (
        <div className="relative w-full h-[280px] md:h-[400px] overflow-hidden bg-gray-100">
          <img
            src={page.hero.url}
            alt={page.hero.alt}
            className="w-full h-full object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-3xl md:text-5xl font-bold text-white drop-shadow-lg">
                {page.title}
              </h1>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 md:py-16">
        {!page.hero && (
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">
            {page.title}
          </h1>
        )}

        {/* Render sanitized HTML content */}
        <div
          className="prose prose-lg prose-gray max-w-none
            prose-headings:font-bold prose-headings:text-gray-900
            prose-p:text-gray-700 prose-p:leading-relaxed
            prose-a:text-orange-600 prose-a:no-underline hover:prose-a:underline
            prose-img:rounded-lg prose-img:shadow-md
            prose-blockquote:border-l-orange-500 prose-blockquote:bg-orange-50/50 prose-blockquote:py-1
            prose-table:border prose-th:bg-gray-50
            prose-code:bg-gray-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm"
          dangerouslySetInnerHTML={{ __html: page.content }}
        />
      </div>

      {/* Published date */}
      {page.published_at && (
        <div className="max-w-4xl mx-auto px-4 pb-12">
          <div className="border-t pt-6 text-sm text-gray-500">
            Dernière mise à jour :{" "}
            {new Date(page.updated_at || page.published_at).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </div>
        </div>
      )}
    </article>
  );
}
