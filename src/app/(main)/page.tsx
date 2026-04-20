import type { Metadata } from "next";
import { createMetadata } from "@/lib/metadata";

/**
 * ═══════════════════════════════════════════════════════════════
 * Root Route Gate — Coming Soon ↔ Home
 * ═══════════════════════════════════════════════════════════════
 *
 * Toggle behaviour:
 *   COMING_SOON_ENABLED=true   → renders the pre-launch landing page
 *   COMING_SOON_ENABLED=false  → renders the real marketplace home
 *   (unset)                    → defaults to false (marketplace live)
 *
 * Architecture notes:
 * - The env var is SERVER-ONLY (no NEXT_PUBLIC_ prefix) so it never
 *   leaks into the client JS bundle.
 * - Both pages are lazy-loaded via dynamic import so the unused page
 *   is NOT included in the JS bundle — zero dead-code cost.
 * - On launch day: set COMING_SOON_ENABLED=false (or remove it)
 *   in the deployment env, redeploy, done. No code change needed.
 * - ISR revalidate is set to 60s in both modes for consistency.
 * ═══════════════════════════════════════════════════════════════
 */

export async function generateMetadata(): Promise<Metadata> {
  const isComingSoon = process.env.COMING_SOON_ENABLED === "true";

  return isComingSoon
    ? createMetadata({
        title: "SUGU — La plus grande marketplace africaine arrive",
        description:
          "Quelque chose d'immense arrive. Découvrez des produits authentiques, une livraison rapide. Inscrivez-vous sur la liste VIP pour le lancement !",
        path: "/",
        image: "https://cdn.sugu.pro/p/sugu_logo.png",
      }, {
        icons: {
          icon: "/favicon.ico",
          apple: "/favicon.ico",
        }
      })
    : createMetadata({
        title: "Accueil",
        description:
          "Découvrez des milliers de produits au meilleur prix sur Sugu. Livraison rapide, paiement sécurisé.",
        path: "/",
      }, {
        icons: {
          icon: "/favicon.ico",
          apple: "/favicon.ico",
        }
      });
}

/**
 * ISR floor — the page is revalidated at most every 60 seconds.
 */
export const revalidate = 60;

export default async function RootPage() {
  const isComingSoon = process.env.COMING_SOON_ENABLED === "true";

  // ── Coming Soon mode ─────────────────────────────────────────
  if (isComingSoon) {
    const { ComingSoon } = await import("@/components/ComingSoon");
    return <ComingSoon />;
  }

  // ── Normal marketplace mode (default) ────────────────────────
  const HomePage = (await import("./_home-page")).default;
  return <HomePage />;
}
