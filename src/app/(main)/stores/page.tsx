import { Container, Breadcrumb } from "@/components/ui";
import { queryAllStores, queryFeaturedStores } from "@/features/store";
import { createMetadata } from "@/lib/metadata";
import StoresHeroBanner from "@/features/store/components/StoresHeroBanner";
import BecomeSellerCTA from "@/features/store/components/BecomeSellerCTA";
import StoresPageClient from "./StoresPageClient";

// ─── Metadata ────────────────────────────────────────────────

export const metadata = createMetadata({
  title: "Nos Boutiques",
  description:
    "Découvrez les meilleurs vendeurs sur SUGU. Des centaines de boutiques vérifiées au Burkina Faso.",
  path: "/stores",
});

// ─── Page Component (Server) ─────────────────────────────────

export default async function StoresPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const category = (sp.category as string) || "all";
  const search = (sp.q as string) || "";
  const page = parseInt((sp.page as string) || "1", 10);

  const [featured, { stores, total, totalPages }] = await Promise.all([
    queryFeaturedStores(),
    queryAllStores(category, search, page),
  ]);

  return (
    <>
      {/* Breadcrumb */}
      <Container className="py-3">
        <Breadcrumb items={[{ label: "Boutiques" }]} />
      </Container>

      {/* Hero banner */}
      <StoresHeroBanner totalStores={total} />

      {/* Main content */}
      <Container as="section" className="py-6 sm:py-8">
        <StoresPageClient
          featuredStores={featured}
          stores={stores}
          totalStores={total}
          totalPages={totalPages}
          currentPage={page}
          initialCategory={category}
          initialSearch={search}
        />
      </Container>

      {/* CTA "Devenez vendeur" */}
      <Container className="pb-10">
        <BecomeSellerCTA />
      </Container>
    </>
  );
}
