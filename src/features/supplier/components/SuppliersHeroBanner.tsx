import { Building2 } from "lucide-react";
import { Container } from "@/components/ui";

interface SuppliersHeroBannerProps {
  totalSuppliers: number;
}

/**
 * Hero for /fournisseurs — aligned with marketplace card language.
 */
export default function SuppliersHeroBanner({
  totalSuppliers,
}: SuppliersHeroBannerProps) {
  return (
    <Container as="section" className="pb-2">
      <div className="rounded-2xl border border-border-light bg-white p-5 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Building2 size={22} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">
              Nos fournisseurs
            </h1>
            <p className="mt-1 text-sm text-muted-foreground leading-relaxed max-w-2xl">
              Grossistes et fabricants vérifiés pour vos achats en gros sur Sugu.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full border border-border bg-background px-3.5 py-1.5 text-sm font-medium text-foreground">
              {totalSuppliers} fournisseur{totalSuppliers !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>
    </Container>
  );
}
