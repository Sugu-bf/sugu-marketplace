import { Building2 } from "lucide-react";
import { Container } from "@/components/ui";

/**
 * Hero for /fournisseurs — aligned with marketplace card language.
 * No count: the vendors API gives none.
 */
export default function SuppliersHeroBanner() {
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
        </div>
      </div>
    </Container>
  );
}
