import { ArrowRight, Factory } from "lucide-react";
import Link from "next/link";

/**
 * CTA inviting visitors to become suppliers — same card language as newsletter.
 */
export default function BecomeSupplierCTA() {
  return (
    <div className="rounded-2xl border border-border-light bg-white p-5 sm:p-8 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div className="flex items-start gap-4 min-w-0">
          <div className="hidden sm:flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Factory size={22} className="text-primary" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg sm:text-xl font-bold text-foreground">
              Devenez fournisseur sur Sugu
            </h2>
            <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
              Proposez vos produits en gros aux revendeurs via l&apos;espace professionnel Sugu Pro.
            </p>
          </div>
        </div>
        <Link
          href="https://pro.sugu.pro/vendeurs"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:bg-primary-dark hover:shadow-lg hover:shadow-primary/25 active:scale-95 flex-shrink-0"
        >
          Créer mon compte fournisseur
          <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
