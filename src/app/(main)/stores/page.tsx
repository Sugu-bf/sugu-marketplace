import { Container, Breadcrumb } from "@/components/ui";
import { queryAllStores, queryTopRatedStores } from "@/features/store";
import { parseSupplierSearchParams } from "@/features/supplier/utils/queryState";
import { createMetadata } from "@/lib/metadata";
import StoresHeroBanner from "@/features/store/components/StoresHeroBanner";
import BecomeSellerCTA from "@/features/store/components/BecomeSellerCTA";
import StoresPageClient from "./StoresPageClient";

// ─── Metadata ────────────────────────────────────────────────

export const metadata = createMetadata({
  title: "Nos Boutiques",
  description:
    "Découvrez les boutiques vérifiées présentes sur SUGU, en Afrique de l'Ouest.",
  path: "/stores",
});

// ─── Page Component (Server) ─────────────────────────────────

export default async function StoresPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const state = parseSupplierSearchParams(await searchParams);

  const [topRated, { stores, nextCursor }] = await Promise.all([
    queryTopRatedStores(),
    queryAllStores(state),
  ]);

  return (
    <>
      {/* Breadcrumb */}
      <Container className="py-3">
        <Breadcrumb items={[{ label: "Boutiques" }]} />
      </Container>

      {/* Hero banner */}
      <StoresHeroBanner />

      {/* Main content */}
      <Container as="section" className="py-6 sm:py-8">
        <StoresPageClient
          topRatedStores={state.cursor || state.q ? [] : topRated}
          stores={stores}
          nextCursor={nextCursor}
          state={state}
        />
      </Container>

      {/* CTA "Devenez vendeur" */}
      <Container className="pb-10">
        <BecomeSellerCTA />
      </Container>
    </>
  );
}
