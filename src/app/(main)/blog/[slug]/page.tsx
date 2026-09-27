import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock } from "lucide-react";
import { SITE_URL, SEO } from "@/lib/constants";
import { API_BASE_URL } from "@/lib/api/config";
import { Container, Breadcrumb } from "@/components/ui";

const API_BASE = `${API_BASE_URL}/v1`;

// ─── Types ───────────────────────────────────────────────

interface BlogPostData {
  id: string;
  title: string;
  slug: string;
  published_at: string;
  updated_at: string;
  excerpt: string | null;
  reading_time: number | null;
  seo: {
    title: string;
    description: string | null;
    noindex: boolean;
    canonical_url: string | null;
    og_image_url: string | null;
  };
  cover: {
    url: string;
    thumb_url: string;
    card_url: string;
    alt: string;
  } | null;
  categories: { name: string; slug: string }[];
  tags: { name: string; slug: string }[];
  author: { name: string } | null;
  content_format: string;
  content: string;
}

interface BlogPostResponse {
  post: BlogPostData;
}

// ─── Data Fetching ───────────────────────────────────────

async function fetchPost(slug: string): Promise<BlogPostData | null> {
  try {
    const res = await fetch(`${API_BASE}/public/blog/posts/${slug}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const data: BlogPostResponse = await res.json();
    return data.post;
  } catch {
    return null;
  }
}

function formatLongDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// ─── Dynamic Metadata ────────────────────────────────────

type MetadataProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({
  params,
}: MetadataProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await fetchPost(slug);

  if (!post) {
    return { title: "Article introuvable" };
  }

  const title = post.seo.title || post.title;
  const description =
    post.seo.description || post.excerpt || SEO.defaultDescription;

  return {
    title,
    description,
    robots: post.seo.noindex ? { index: false, follow: false } : undefined,
    alternates: post.seo.canonical_url
      ? { canonical: post.seo.canonical_url }
      : { canonical: `${SITE_URL}/blog/${post.slug}` },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/blog/${post.slug}`,
      type: "article",
      publishedTime: post.published_at,
      modifiedTime: post.updated_at,
      authors: post.author ? [post.author.name] : undefined,
      ...(post.seo.og_image_url
        ? {
            images: [{ url: post.seo.og_image_url, width: 1200, height: 630 }],
          }
        : post.cover
          ? {
              images: [{ url: post.cover.url, width: 1200, height: 630 }],
            }
          : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(post.seo.og_image_url
        ? { images: [post.seo.og_image_url] }
        : post.cover
          ? { images: [post.cover.url] }
          : {}),
    },
  };
}

// ─── Page Component ──────────────────────────────────────

type PageProps = { params: Promise<{ slug: string }> };

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await fetchPost(slug);

  if (!post) {
    notFound();
  }

  return (
    <article className="min-h-screen bg-background">
      <Container className="py-3">
        <Breadcrumb
          items={[
            { label: "Blog", href: "/blog" },
            { label: post.title },
          ]}
        />
      </Container>

      {/* Cover */}
      {post.cover && (
        <Container className="pb-2">
          <div className="relative overflow-hidden rounded-2xl border border-border-light bg-muted shadow-sm h-[240px] sm:h-[360px] md:h-[420px]">
            <Image
              src={post.cover.url}
              alt={post.cover.alt}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 1400px) 100vw, 1400px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/25 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8 md:p-10">
              {post.categories.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {post.categories.map((cat) => (
                    <Link
                      key={cat.slug}
                      href={`/blog?category=${cat.slug}`}
                      className="rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm hover:bg-white/30 transition-colors"
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
              )}
              <h1 className="max-w-3xl text-2xl sm:text-3xl md:text-4xl font-extrabold text-white leading-tight drop-shadow-sm">
                {post.title}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/85">
                {post.author && (
                  <span className="font-medium">{post.author.name}</span>
                )}
                <time dateTime={post.published_at}>
                  {formatLongDate(post.published_at)}
                </time>
                {post.reading_time != null && (
                  <span className="inline-flex items-center gap-1">
                    <Clock size={14} />
                    {post.reading_time} min de lecture
                  </span>
                )}
              </div>
            </div>
          </div>
        </Container>
      )}

      <Container className="py-8 md:py-12">
        <div className="mx-auto max-w-3xl">
          {!post.cover && (
            <header className="mb-8">
              {post.categories.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-2">
                  {post.categories.map((cat) => (
                    <Link
                      key={cat.slug}
                      href={`/blog?category=${cat.slug}`}
                      className="rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary hover:bg-primary hover:text-white transition-colors"
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
              )}
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-foreground leading-tight">
                {post.title}
              </h1>
              <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                {post.author && (
                  <span className="font-medium text-foreground/80">
                    {post.author.name}
                  </span>
                )}
                <time dateTime={post.published_at}>
                  {formatLongDate(post.published_at)}
                </time>
                {post.reading_time != null && (
                  <span className="inline-flex items-center gap-1">
                    <Clock size={14} />
                    {post.reading_time} min de lecture
                  </span>
                )}
              </div>
            </header>
          )}

          <div
            className="prose prose-lg max-w-none
              prose-headings:font-bold prose-headings:text-foreground
              prose-p:text-foreground/80 prose-p:leading-relaxed
              prose-a:text-primary prose-a:no-underline hover:prose-a:underline
              prose-img:rounded-xl prose-img:border prose-img:border-border-light
              prose-blockquote:border-l-primary prose-blockquote:bg-primary-50/50 prose-blockquote:py-1 prose-blockquote:rounded-r-lg
              prose-th:bg-muted
              prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
              prose-li:marker:text-primary"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {post.tags.length > 0 && (
            <div className="mt-10 border-t border-border-light pt-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Tags
                </span>
                {post.tags.map((tag) => (
                  <Link
                    key={tag.slug}
                    href={`/blog?tag=${tag.slug}`}
                    className="rounded-full border border-border bg-white px-3 py-1 text-xs font-medium text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
                  >
                    #{tag.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="mt-10 flex flex-col gap-3 border-t border-border-light pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Dernière mise à jour :{" "}
              {formatLongDate(post.updated_at || post.published_at)}
            </p>
            <Link
              href="/blog"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-dark transition-colors"
            >
              <ArrowLeft size={16} />
              Retour au blog
            </Link>
          </div>
        </div>
      </Container>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: post.title,
            description: post.excerpt || post.seo.description,
            datePublished: post.published_at,
            dateModified: post.updated_at,
            author: post.author
              ? { "@type": "Person", name: post.author.name }
              : undefined,
            image: post.cover?.url || post.seo.og_image_url,
            url: `${SITE_URL}/blog/${post.slug}`,
            publisher: {
              "@type": "Organization",
              name: "Sugu",
              url: SITE_URL,
            },
          }),
        }}
      />
    </article>
  );
}
