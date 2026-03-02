import { Store } from "lucide-react";
import { Container } from "@/components/ui";

interface StoresHeroBannerProps {
  totalStores: number;
}

/**
 * Hero banner for the /stores listing page.
 * Dark gradient with stats pills and wave separator.
 */
export default function StoresHeroBanner({
  totalStores,
}: StoresHeroBannerProps) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary-900 via-primary-700 to-primary">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(255,255,255,0.15)_0%,transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_60%,rgba(255,255,255,0.1)_0%,transparent_50%)]" />
      </div>

      <Container className="relative py-10 sm:py-14 lg:py-16">
        <div className="flex items-center gap-3 mb-2">
          <Store size={28} className="text-white" />
          <h1 className="text-2xl font-extrabold text-white sm:text-3xl">
            Nos Boutiques
          </h1>
        </div>
        <p className="mt-2 max-w-xl text-sm text-white/70 sm:text-base leading-relaxed">
          Découvrez les meilleurs vendeurs sur SUGU
        </p>

        <div className="mt-4 flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur-sm px-3.5 py-1.5 text-sm font-medium text-white">
            {totalStores} boutique{totalStores !== 1 ? "s" : ""}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur-sm px-3.5 py-1.5 text-sm font-medium text-white">
            12 catégories
          </span>
        </div>
      </Container>

      {/* Bottom wave separator */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg
          viewBox="0 0 1440 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-6 sm:h-8"
          preserveAspectRatio="none"
        >
          <path
            d="M0 48h1440V24c-240 16-480 24-720 24S240 40 0 24v24z"
            fill="var(--color-background)"
          />
        </svg>
      </div>
    </section>
  );
}
