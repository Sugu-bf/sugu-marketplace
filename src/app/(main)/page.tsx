import type { Metadata } from "next";
import { createMetadata } from "@/lib/metadata";
import HomePage from "./_home-page";

/**
 * The marketplace home. While COMING_SOON_ENABLED is on, the proxy serves
 * /coming-soon in place of "/" (see @/lib/coming-soon), so this page never
 * has to know about the pre-launch mode.
 */
export const metadata: Metadata = createMetadata({
  title: "Accueil",
  description:
    "Découvrez des milliers de produits au meilleur prix sur Sugu. Livraison rapide, paiement sécurisé.",
  path: "/",
});

/**
 * ISR floor — the page is revalidated at most every 60 seconds.
 */
export const revalidate = 60;

export default function RootPage() {
  return <HomePage />;
}
