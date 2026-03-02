import { ArrowRight, Store } from "lucide-react";
import Link from "next/link";

/**
 * CTA banner encouraging visitors to become sellers on SUGU.
 * Server component.
 */
export default function BecomeSellerCTA() {
  return (
    <div className="rounded-2xl bg-gradient-to-r from-primary to-primary-dark p-8 sm:p-10 animate-fade-slide-up">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Store size={22} className="text-white" />
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              Devenez vendeur sur SUGU
            </h2>
          </div>
          <p className="text-sm text-white/80 mt-1">
            Vendez vos produits à des milliers de clients au Burkina Faso
          </p>
        </div>
        <Link
          href="/vendor/register"
          className="rounded-full bg-white text-foreground px-6 py-3 text-sm font-bold hover:bg-gray-100 transition-colors inline-flex items-center gap-2 flex-shrink-0"
        >
          Créer ma boutique
          <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
