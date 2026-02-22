import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { SITE_URL, SEO } from "@/lib/constants";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

// ─── Types ───────────────────────────────────────────────

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  published_at: string;
  reading_time: number | null;
  cover: {
    url: string;
    thumb_url: string;
    card_url: string;
    alt: string;
  } | null;
  categories: { name: string; slug: string }[];
  tags: { name: string; slug: string }[];
  author: { name: string } | null;
}

interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  posts_count: number;
}

interface BlogListResponse {
  items: BlogPost[];
  meta: {
    page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
}

// ─── Data Fetching ───────────────────────────────────────

async function fetchPosts(
  params: Record<string, string> = {}
): Promise<BlogListResponse | null> {
  try {
    const searchParams = new URLSearchParams(params);
    const res = await fetch(
      `${API_BASE}/public/blog/posts?${searchParams.toString()}`,
      { next: { revalidate: 300 } }
    );
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function fetchCategories(): Promise<BlogCategory[]> {
  try {
    const res = await fetch(`${API_BASE}/public/blog/categories`, {
      next: { revalidate: 600 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.categories ?? [];
  } catch {
    return [];
  }
}

// ─── Metadata ────────────────────────────────────────────

export const metadata: Metadata = {
  title: "Blog — Sugu",
  description:
    "Découvrez nos derniers articles, conseils et actualités sur Sugu.",
  alternates: { canonical: `${SITE_URL}/blog` },
  openGraph: {
    title: "Blog — Sugu",
    description:
      "Découvrez nos derniers articles, conseils et actualités sur Sugu.",
    url: `${SITE_URL}/blog`,
    type: "website",
  },
};

// ─── Page Component ──────────────────────────────────────

type PageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function BlogIndexPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = typeof params.page === "string" ? params.page : "1";
  const category =
    typeof params.category === "string" ? params.category : undefined;
  const q = typeof params.q === "string" ? params.q : undefined;

  const fetchParams: Record<string, string> = { page, per_page: "12" };
  if (category) fetchParams.category = category;
  if (q) fetchParams.q = q;

  const [postsData, categories] = await Promise.all([
    fetchPosts(fetchParams),
    fetchCategories(),
  ]);

  const posts = postsData?.items ?? [];
  const meta = postsData?.meta ?? {
    page: 1,
    per_page: 12,
    total: 0,
    last_page: 1,
  };

  return (
    <div className="min-h-screen bg-gray-50/30">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-orange-500 via-orange-600 to-red-500 text-white">
        <div className="max-w-7xl mx-auto px-4 py-16 md:py-24">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
            Notre Blog
          </h1>
          <p className="mt-4 text-lg md:text-xl text-orange-100 max-w-2xl">
            Conseils, actualités et découvertes pour vos achats sur Sugu
          </p>

          {/* Search */}
          <form
            action="/blog"
            method="GET"
            className="mt-8 flex max-w-lg"
          >
            {category && (
              <input type="hidden" name="category" value={category} />
            )}
            <input
              type="text"
              name="q"
              defaultValue={q ?? ""}
              placeholder="Rechercher un article..."
              className="flex-1 px-5 py-3 rounded-l-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 border-0"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white font-bold text-sm rounded-r-xl transition-colors"
            >
              Rechercher
            </button>
          </form>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Main Content */}
          <div className="flex-1">
            {/* Active Filters */}
            {(category || q) && (
              <div className="flex items-center gap-3 mb-8 flex-wrap">
                {category && (
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg text-sm font-medium">
                    Catégorie: {category}
                    <Link
                      href={q ? `/blog?q=${q}` : "/blog"}
                      className="ml-1 hover:text-orange-900"
                    >
                      ✕
                    </Link>
                  </span>
                )}
                {q && (
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium">
                    Recherche: &quot;{q}&quot;
                    <Link
                      href={
                        category ? `/blog?category=${category}` : "/blog"
                      }
                      className="ml-1 hover:text-blue-900"
                    >
                      ✕
                    </Link>
                  </span>
                )}
                <Link
                  href="/blog"
                  className="text-xs text-gray-400 hover:text-gray-600 font-medium"
                >
                  Effacer tout
                </Link>
              </div>
            )}

            {/* Posts Grid */}
            {posts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {posts.map((post) => (
                  <article
                    key={post.id}
                    className="group bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                  >
                    {/* Cover Image */}
                    <Link href={`/blog/${post.slug}`}>
                      <div className="relative h-48 bg-gray-100 overflow-hidden">
                        {post.cover ? (
                          <Image
                            src={post.cover.card_url || post.cover.url}
                            alt={post.cover.alt}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-100 to-orange-200">
                            <svg
                              className="w-12 h-12 text-orange-300"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2 2 0 00-2-2h-2"
                              />
                            </svg>
                          </div>
                        )}
                      </div>
                    </Link>

                    <div className="p-5">
                      {/* Categories */}
                      {post.categories.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {post.categories.map((cat) => (
                            <Link
                              key={cat.slug}
                              href={`/blog?category=${cat.slug}`}
                              className="text-xs font-bold text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded-full hover:bg-orange-100 transition-colors"
                            >
                              {cat.name}
                            </Link>
                          ))}
                        </div>
                      )}

                      {/* Title */}
                      <Link href={`/blog/${post.slug}`}>
                        <h2 className="text-lg font-bold text-gray-900 group-hover:text-orange-600 transition-colors line-clamp-2">
                          {post.title}
                        </h2>
                      </Link>

                      {/* Excerpt */}
                      {post.excerpt && (
                        <p className="mt-2 text-sm text-gray-500 leading-relaxed line-clamp-3">
                          {post.excerpt}
                        </p>
                      )}

                      {/* Meta */}
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50">
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          {post.author && (
                            <span className="font-medium text-gray-600">
                              {post.author.name}
                            </span>
                          )}
                          <span>·</span>
                          <time>
                            {new Date(post.published_at).toLocaleDateString(
                              "fr-FR",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              }
                            )}
                          </time>
                        </div>
                        {post.reading_time && (
                          <span className="text-xs text-gray-400">
                            {post.reading_time} min
                          </span>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-gray-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2 2 0 00-2-2h-2"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-600">
                  Aucun article trouvé
                </h3>
                <p className="text-sm text-gray-400 mt-1">
                  Essayez de modifier vos filtres
                </p>
                <Link
                  href="/blog"
                  className="inline-block mt-6 px-6 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-bold hover:bg-orange-600 transition-colors"
                >
                  Voir tous les articles
                </Link>
              </div>
            )}

            {/* Pagination */}
            {meta.last_page > 1 && (
              <nav className="flex items-center justify-center gap-2 mt-12">
                {meta.page > 1 && (
                  <Link
                    href={`/blog?page=${meta.page - 1}${category ? `&category=${category}` : ""}${q ? `&q=${q}` : ""}`}
                    className="px-4 py-2 rounded-xl text-sm font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    ← Précédent
                  </Link>
                )}

                {Array.from({ length: meta.last_page }, (_, i) => i + 1)
                  .filter(
                    (p) =>
                      p === 1 ||
                      p === meta.last_page ||
                      Math.abs(p - meta.page) <= 2
                  )
                  .map((p, idx, arr) => (
                    <span key={p}>
                      {idx > 0 && arr[idx - 1] !== p - 1 && (
                        <span className="px-2 text-gray-300">…</span>
                      )}
                      <Link
                        href={`/blog?page=${p}${category ? `&category=${category}` : ""}${q ? `&q=${q}` : ""}`}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                          p === meta.page
                            ? "bg-orange-500 text-white"
                            : "text-gray-600 bg-white border border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        {p}
                      </Link>
                    </span>
                  ))}

                {meta.page < meta.last_page && (
                  <Link
                    href={`/blog?page=${meta.page + 1}${category ? `&category=${category}` : ""}${q ? `&q=${q}` : ""}`}
                    className="px-4 py-2 rounded-xl text-sm font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    Suivant →
                  </Link>
                )}
              </nav>
            )}
          </div>

          {/* Sidebar */}
          <aside className="lg:w-72 shrink-0 space-y-8">
            {/* Categories */}
            {categories.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider mb-4">
                  Catégories
                </h3>
                <ul className="space-y-2">
                  <li>
                    <Link
                      href="/blog"
                      className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        !category
                          ? "bg-orange-50 text-orange-700"
                          : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      Tous les articles
                    </Link>
                  </li>
                  {categories.map((cat) => (
                    <li key={cat.id}>
                      <Link
                        href={`/blog?category=${cat.slug}`}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          category === cat.slug
                            ? "bg-orange-50 text-orange-700"
                            : "text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        <span>{cat.name}</span>
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                          {cat.posts_count}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
