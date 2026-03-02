import { notFound } from "next/navigation";
import { createMetadata } from "@/lib/metadata";
import { CacheTags, RevalidatePresets, ApiError } from "@/lib/api";
import { Container, Breadcrumb } from "@/components/ui";
import { fetchVendorPage } from "@/features/store/api/store.api";
import {
  mapVendorToStore,
  mapVendorProductToListItem,
} from "@/features/store/api/store.mappers";
import { parseStoreSearchParams } from "@/features/store/utils/queryState";
import type { ProductsMeta } from "@/features/store/api/store.schemas";
import StoreHeroBanner from "@/features/store/components/StoreHeroBanner";
import StorePageClient from "@/features/store/components/StorePageClient";
import StoreAboutSection from "@/features/store/components/StoreAboutSection";

// ─── Dynamic Metadata ────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  try {
    const { data } = await fetchVendorPage(
      { slug, limit: 1 },
      {
        revalidate: RevalidatePresets.static,
        tags: [CacheTags.store(slug)],
      },
    );

    return createMetadata({
      title: data.vendor.name,
      description:
        data.vendor.description.slice(0, 160) ||
        `Découvrez la boutique ${data.vendor.name} sur Sugu.`,
      path: `/store/${slug}`,
    });
  } catch {
    return createMetadata({
      title: "Boutique introuvable",
      description: "La boutique demandée n'existe pas sur Sugu.",
      path: `/store/${slug}`,
      noIndex: true,
    });
  }
}

// ─── Page Component (Server) ─────────────────────────────────

export default async function StorePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const state = parseStoreSearchParams(sp);

  try {
    const { data } = await fetchVendorPage(
      {
        slug,
        limit: 20,
        sort: state.sort,
        q: state.q || undefined,
        cursor: state.cursor ?? undefined,
      },
      {
        revalidate: RevalidatePresets.frequent, // 2 min
        tags: [CacheTags.store(slug), CacheTags.storeProducts(slug)],
      },
    );

    // Map API data → UI types
    const store = mapVendorToStore(data.vendor, data.reviews);
    const products = data.products.items.map((p) =>
      mapVendorProductToListItem(p, data.vendor.name),
    );

    return (
      <>
        {/* ─── Breadcrumb ───────────────────────────────────────── */}
        <Container className="py-3">
          <Breadcrumb
            items={[
              { label: "Boutiques", href: "/boutiques" },
              { label: store.name },
            ]}
          />
        </Container>

        {/* ─── Store Hero Banner ────────────────────────────────── */}
        <StoreHeroBanner
          store={store}
          storeId={data.vendor.id}
          isFollowed={data.vendor.is_followed}
        />

        {/* ─── Products + Filters ───────────────────────────────── */}
        <Container as="section" className="py-6 sm:py-8">
          <StorePageClient
            store={store}
            storeSlug={slug}
            initialProducts={products}
            totalProducts={data.products.meta.total}
            hasMore={data.products.meta.has_more}
            nextCursor={data.products.meta.next_cursor}
            initialSort={state.sort}
            initialSearch={state.q}
            initialView={state.view}
          />
        </Container>

        {/* ─── About + Reviews ──────────────────────────────────── */}
        <Container as="section" className="pb-10">
          <StoreAboutSection store={store} />
        </Container>
      </>
    );
  } catch (error) {
    // 404 from API → Next.js notFound
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    // Re-throw for error.tsx boundary
    throw error;
  }
}
