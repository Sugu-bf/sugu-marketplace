import { Container, Breadcrumb } from "@/components/ui";
import {
  queryAllSuppliers,
  queryFeaturedSuppliers,
  parseSupplierSearchParams,
} from "@/features/supplier";
import { createMetadata } from "@/lib/metadata";
import SuppliersHeroBanner from "@/features/supplier/components/SuppliersHeroBanner";
import BecomeSupplierCTA from "@/features/supplier/components/BecomeSupplierCTA";
import SuppliersPageClient from "./SuppliersPageClient";

// ─── Metadata ────────────────────────────────────────────────

export const metadata = createMetadata({
  title: "Nos Fournisseurs",
  description:
    "Découvrez les grossistes et fabricants présents sur SUGU, en Afrique de l'Ouest.",
  path: "/fournisseurs",
});

// ─── Page Component (Server) ─────────────────────────────────

export default async function SuppliersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const state = parseSupplierSearchParams(await searchParams);

  const [featured, { suppliers, nextCursor }] = await Promise.all([
    queryFeaturedSuppliers(),
    queryAllSuppliers(state),
  ]);

  return (
    <>
      {/* Breadcrumb */}
      <Container className="py-3">
        <Breadcrumb items={[{ label: "Fournisseurs" }]} />
      </Container>

      {/* Hero banner */}
      <SuppliersHeroBanner />

      {/* Main content */}
      <Container as="section" className="py-6 sm:py-8">
        <SuppliersPageClient
          featuredSuppliers={state.cursor || state.q ? [] : featured}
          suppliers={suppliers}
          nextCursor={nextCursor}
          state={state}
        />
      </Container>

      {/* CTA "Devenez fournisseur" */}
      <Container className="pb-10">
        <BecomeSupplierCTA />
      </Container>
    </>
  );
}
