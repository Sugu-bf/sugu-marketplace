import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { SITE_URL, SEO } from "@/lib/constants";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

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
            images: [
              { url: post.seo.og_image_url, width: 1200, height: 630 },
            ],
          }
        : post.cover
          ? {
              images: [
                { url: post.cover.url, width: 1200, height: 630 },
              ],
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
    <article className="min-h-screen bg-white">
      {/* Cover Image */}
      {post.cover && (
        <div className="relative w-full h-[320px] md:h-[480px] overflow-hidden bg-gray-100">
          <Image
            src={post.cover.url}
            alt={post.cover.alt}
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12">
            <div className="max-w-4xl mx-auto">
              {/* Categories on cover */}
              {post.categories.length > 0 && (
                <div className="flex gap-2 mb-4">
                  {post.categories.map((cat) => (
                    <Link
                      key={cat.slug}
                      href={`/blog?category=${cat.slug}`}
                      className="text-xs font-bold bg-white/20 text-white px-3 py-1 rounded-full backdrop-blur-sm hover:bg-white/30 transition-colors"
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
              )}
              <h1 className="text-3xl md:text-5xl font-extrabold text-white drop-shadow-lg leading-tight">
                {post.title}
              </h1>
              {/* Meta on cover */}
              <div className="flex items-center gap-4 mt-4 text-sm text-white/80">
                {post.author && (
                  <span className="font-medium">{post.author.name}</span>
                )}
                <time>
                  {new Date(post.published_at).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </time>
                {post.reading_time && (
                  <span className="flex items-center gap-1">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z"
                      />
                    </svg>
                    {post.reading_time} min de lecture
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 md:py-16">
        {/* Title without cover */}
        {!post.cover && (
          <header className="mb-10">
            {post.categories.length > 0 && (
              <div className="flex gap-2 mb-4">
                {post.categories.map((cat) => (
                  <Link
                    key={cat.slug}
                    href={`/blog?category=${cat.slug}`}
                    className="text-xs font-bold bg-orange-50 text-orange-600 px-3 py-1 rounded-full hover:bg-orange-100 transition-colors"
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            )}
            <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 leading-tight">
              {post.title}
            </h1>
            <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
              {post.author && (
                <span className="font-medium text-gray-700">
                  {post.author.name}
                </span>
              )}
              <time>
                {new Date(post.published_at).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </time>
              {post.reading_time && (
                <span>{post.reading_time} min de lecture</span>
              )}
            </div>
          </header>
        )}

        {/* Article Content */}
        <div
          className="prose prose-lg prose-gray max-w-none
            prose-headings:font-extrabold prose-headings:text-gray-900
            prose-p:text-gray-700 prose-p:leading-relaxed
            prose-a:text-orange-600 prose-a:no-underline hover:prose-a:underline
            prose-img:rounded-xl prose-img:shadow-md
            prose-blockquote:border-l-orange-500 prose-blockquote:bg-orange-50/50 prose-blockquote:py-1 prose-blockquote:rounded-r-lg
            prose-table:border prose-th:bg-gray-50
            prose-code:bg-gray-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
            prose-li:marker:text-orange-500"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="mt-12 pt-8 border-t border-gray-100">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Tags:
              </span>
              {post.tags.map((tag) => (
                <Link
                  key={tag.slug}
                  href={`/blog?tag=${tag.slug}`}
                  className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium hover:bg-gray-200 transition-colors"
                >
                  #{tag.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-100 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Dernière mise à jour :{" "}
            {new Date(post.updated_at || post.published_at).toLocaleDateString(
              "fr-FR",
              {
                day: "numeric",
                month: "long",
                year: "numeric",
              }
            )}
          </div>
          <Link
            href="/blog"
            className="text-sm font-bold text-orange-600 hover:text-orange-700 transition-colors flex items-center gap-1"
          >
            ← Retour au blog
          </Link>
        </div>
      </div>

      {/* JSON-LD Structured Data */}
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
