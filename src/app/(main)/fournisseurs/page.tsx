import { Container, Breadcrumb } from "@/components/ui";
import { queryAllSuppliers, queryFeaturedSuppliers } from "@/features/supplier";
import { createMetadata } from "@/lib/metadata";
import SuppliersHeroBanner from "@/features/supplier/components/SuppliersHeroBanner";
import BecomeSupplierCTA from "@/features/supplier/components/BecomeSupplierCTA";
import SuppliersPageClient from "./SuppliersPageClient";

// ─── Metadata ────────────────────────────────────────────────

export const metadata = createMetadata({
  title: "Nos Fournisseurs",
  description:
    "Découvrez les grossistes et fabricants de confiance sur SUGU. Des dizaines de fournisseurs vérifiés en Afrique de l'Ouest.",
  path: "/fournisseurs",
});

// ─── Page Component (Server) ─────────────────────────────────

export default async function SuppliersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const sector = (sp.sector as string) || "all";
  const search = (sp.q as string) || "";
  const page = parseInt((sp.page as string) || "1", 10);

  const [featured, { suppliers, total, totalPages }] = await Promise.all([
    queryFeaturedSuppliers(),
    queryAllSuppliers(sector, search, page),
  ]);

  return (
    <>
      {/* Breadcrumb */}
      <Container className="py-3">
        <Breadcrumb items={[{ label: "Fournisseurs" }]} />
      </Container>

      {/* Hero banner */}
      <SuppliersHeroBanner totalSuppliers={total} />

      {/* Main content */}
      <Container as="section" className="py-6 sm:py-8">
        <SuppliersPageClient
          featuredSuppliers={featured}
          suppliers={suppliers}
          totalSuppliers={total}
          totalPages={totalPages}
          currentPage={page}
          initialSector={sector}
          initialSearch={search}
        />
      </Container>

      {/* CTA "Devenez fournisseur" */}
      <Container className="pb-10">
        <BecomeSupplierCTA />
      </Container>
    </>
  );
}
