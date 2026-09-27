import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Newspaper, Search, Clock, X } from "lucide-react";
import { createMetadata } from "@/lib/metadata";
import { API_BASE_URL } from "@/lib/api/config";
import { Container, Breadcrumb } from "@/components/ui";
import { cn } from "@/lib/utils";

const API_BASE = `${API_BASE_URL}/v1`;

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

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function blogHref(opts: {
  page?: number;
  category?: string;
  q?: string;
}) {
  const sp = new URLSearchParams();
  if (opts.page && opts.page > 1) sp.set("page", String(opts.page));
  if (opts.category) sp.set("category", opts.category);
  if (opts.q) sp.set("q", opts.q);
  const qs = sp.toString();
  return qs ? `/blog?${qs}` : "/blog";
}

// ─── Metadata ────────────────────────────────────────────

type PageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata({
  searchParams,
}: PageProps): Promise<Metadata> {
  const params = await searchParams;
  const category =
    typeof params.category === "string" ? params.category : undefined;
  const q = typeof params.q === "string" ? params.q : undefined;
  const page =
    typeof params.page === "string"
      ? Math.max(1, Number.parseInt(params.page, 10) || 1)
      : 1;
  const hasSearchOrFilter = Boolean(category || q);

  return createMetadata({
    title: page > 1 && !hasSearchOrFilter ? `Blog — Page ${page}` : "Blog",
    description:
      "Découvrez les derniers articles, conseils et actualités de l’écosystème Sugu.",
    path: page > 1 && !hasSearchOrFilter ? `/blog?page=${page}` : "/blog",
    noIndex: hasSearchOrFilter,
    type: "website",
  });
}

// ─── Page Component ──────────────────────────────────────

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
  const activeCategoryName = categories.find((c) => c.slug === category)?.name;

  return (
    <>
      <Container className="py-3">
        <Breadcrumb
          items={[
            { label: "Blog" },
            ...(activeCategoryName
              ? [{ label: activeCategoryName }]
              : q
                ? [{ label: `« ${q} »` }]
                : []),
          ]}
        />
      </Container>

      {/* Hero — même langage que boutiques / fournisseurs */}
      <Container as="section" className="pb-2">
        <div className="rounded-2xl border border-border-light bg-white p-5 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Newspaper size={22} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                Notre blog
              </h1>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed max-w-2xl">
                Conseils, actualités et découvertes pour vos achats sur Sugu.
              </p>
            </div>
            <span className="inline-flex items-center rounded-full border border-border bg-background px-3.5 py-1.5 text-sm font-medium text-foreground self-start sm:self-center">
              {meta.total} article{meta.total !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </Container>

      <Container as="section" className="py-6 sm:py-8">
        {/* Toolbar: search */}
        <form
          action="/blog"
          method="GET"
          className="relative mb-5 max-w-md"
        >
          {category && (
            <input type="hidden" name="category" value={category} />
          )}
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
          <input
            type="text"
            name="q"
            defaultValue={q ?? ""}
            placeholder="Rechercher un article..."
            className="w-full rounded-full border border-border bg-white pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
          />
        </form>

        {/* Category pills (mobile + desktop) */}
        {categories.length > 0 && (
          <div className="mb-6 flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            <Link
              href={q ? `/blog?q=${encodeURIComponent(q)}` : "/blog"}
              className={cn(
                "inline-flex flex-shrink-0 items-center rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors",
                !category
                  ? "bg-primary text-white"
                  : "border border-border text-muted-foreground hover:border-primary/40 hover:text-primary"
              )}
            >
              Tous
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={blogHref({ category: cat.slug, q })}
                className={cn(
                  "inline-flex flex-shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors",
                  category === cat.slug
                    ? "bg-primary text-white"
                    : "border border-border text-muted-foreground hover:border-primary/40 hover:text-primary"
                )}
              >
                {cat.name}
                <span
                  className={cn(
                    "text-[10px]",
                    category === cat.slug
                      ? "text-white/70"
                      : "text-muted-foreground"
                  )}
                >
                  {cat.posts_count}
                </span>
              </Link>
            ))}
          </div>
        )}

        {/* Active filters */}
        {(category || q) && (
          <div className="mb-6 flex flex-wrap items-center gap-2">
            {category && (
              <Link
                href={q ? `/blog?q=${encodeURIComponent(q)}` : "/blog"}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary hover:bg-primary hover:text-white transition-colors"
              >
                {activeCategoryName ?? category}
                <X size={12} strokeWidth={2.5} />
              </Link>
            )}
            {q && (
              <Link
                href={category ? `/blog?category=${category}` : "/blog"}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary hover:bg-primary hover:text-white transition-colors"
              >
                « {q} »
                <X size={12} strokeWidth={2.5} />
              </Link>
            )}
            <Link
              href="/blog"
              className="text-xs text-muted-foreground underline underline-offset-2 hover:text-primary"
            >
              Effacer tout
            </Link>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main */}
          <div className="flex-1 min-w-0">
            {posts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
                {posts.map((post) => (
                  <article
                    key={post.id}
                    className="group flex flex-col overflow-hidden rounded-2xl border border-border-light bg-white shadow-sm transition-all duration-200 hover:shadow-md hover:border-primary/20"
                  >
                    <Link
                      href={`/blog/${post.slug}`}
                      className="relative block h-44 bg-muted overflow-hidden"
                    >
                      {post.cover ? (
                        <Image
                          src={post.cover.card_url || post.cover.url}
                          alt={post.cover.alt}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                          sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-primary-50">
                          <Newspaper
                            size={36}
                            className="text-primary/40"
                            strokeWidth={1.5}
                          />
                        </div>
                      )}
                    </Link>

                    <div className="flex flex-1 flex-col p-4 sm:p-5">
                      {post.categories.length > 0 && (
                        <div className="mb-2.5 flex flex-wrap gap-1.5">
                          {post.categories.slice(0, 2).map((cat) => (
                            <Link
                              key={cat.slug}
                              href={`/blog?category=${cat.slug}`}
                              className="rounded-full bg-primary-50 px-2.5 py-0.5 text-[11px] font-medium text-primary hover:bg-primary hover:text-white transition-colors"
                            >
                              {cat.name}
                            </Link>
                          ))}
                        </div>
                      )}

                      <Link href={`/blog/${post.slug}`}>
                        <h2 className="text-base font-bold text-foreground leading-snug line-clamp-2 transition-colors group-hover:text-primary">
                          {post.title}
                        </h2>
                      </Link>

                      {post.excerpt && (
                        <p className="mt-2 text-sm text-muted-foreground leading-relaxed line-clamp-3 flex-1">
                          {post.excerpt}
                        </p>
                      )}

                      <div className="mt-4 flex items-center justify-between gap-2 border-t border-border-light pt-3 text-xs text-muted-foreground">
                        <div className="flex min-w-0 items-center gap-1.5 truncate">
                          {post.author && (
                            <span className="truncate font-medium text-foreground/70">
                              {post.author.name}
                            </span>
                          )}
                          {post.author && <span aria-hidden>·</span>}
                          <time dateTime={post.published_at}>
                            {formatDate(post.published_at)}
                          </time>
                        </div>
                        {post.reading_time != null && (
                          <span className="inline-flex flex-shrink-0 items-center gap-1">
                            <Clock size={12} strokeWidth={2} />
                            {post.reading_time} min
                          </span>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary-50">
                  <Newspaper size={32} className="text-primary" strokeWidth={1.5} />
                </div>
                <h3 className="text-lg font-bold text-foreground">
                  Aucun article trouvé
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Essayez de modifier vos filtres ou votre recherche.
                </p>
                <Link
                  href="/blog"
                  className="mt-6 inline-flex items-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark transition-colors"
                >
                  Voir tous les articles
                </Link>
              </div>
            )}

            {meta.last_page > 1 && (
              <nav
                className="mt-10 flex flex-wrap items-center justify-center gap-2"
                aria-label="Pagination"
              >
                {meta.page > 1 && (
                  <Link
                    href={blogHref({
                      page: meta.page - 1,
                      category,
                      q,
                    })}
                    className="rounded-full border border-border bg-white px-4 py-2 text-sm font-medium text-foreground hover:border-primary/40 hover:text-primary transition-colors"
                  >
                    Précédent
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
                    <span key={p} className="inline-flex items-center">
                      {idx > 0 && arr[idx - 1] !== p - 1 && (
                        <span className="px-1 text-muted-foreground">…</span>
                      )}
                      <Link
                        href={blogHref({ page: p, category, q })}
                        className={cn(
                          "inline-flex h-9 min-w-9 items-center justify-center rounded-full px-3 text-sm font-medium transition-colors",
                          p === meta.page
                            ? "bg-primary text-white"
                            : "border border-border bg-white text-foreground hover:border-primary/40 hover:text-primary"
                        )}
                        aria-current={p === meta.page ? "page" : undefined}
                      >
                        {p}
                      </Link>
                    </span>
                  ))}

                {meta.page < meta.last_page && (
                  <Link
                    href={blogHref({
                      page: meta.page + 1,
                      category,
                      q,
                    })}
                    className="rounded-full border border-border bg-white px-4 py-2 text-sm font-medium text-foreground hover:border-primary/40 hover:text-primary transition-colors"
                  >
                    Suivant
                  </Link>
                )}
              </nav>
            )}
          </div>

          {/* Sidebar */}
          {categories.length > 0 && (
            <aside className="hidden w-64 shrink-0 lg:block">
              <div className="sticky top-4 rounded-2xl border border-border-light bg-white p-5 shadow-sm">
                <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-foreground">
                  <Newspaper size={16} className="text-primary" />
                  Catégories
                </h2>
                <ul className="space-y-1">
                  <li>
                    <Link
                      href={q ? `/blog?q=${encodeURIComponent(q)}` : "/blog"}
                      className={cn(
                        "flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        !category
                          ? "bg-primary-50 text-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      Tous les articles
                    </Link>
                  </li>
                  {categories.map((cat) => (
                    <li key={cat.id}>
                      <Link
                        href={blogHref({ category: cat.slug, q })}
                        className={cn(
                          "flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                          category === cat.slug
                            ? "bg-primary-50 text-primary"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <span className="truncate">{cat.name}</span>
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-medium",
                            category === cat.slug
                              ? "bg-primary/15 text-primary"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {cat.posts_count}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>
          )}
        </div>
      </Container>
    </>
  );
}
