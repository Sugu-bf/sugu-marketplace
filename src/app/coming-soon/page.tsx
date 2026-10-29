import { createMetadata } from "@/lib/metadata";
import { ComingSoon } from "@/components/ComingSoon";

/**
 * The pre-launch landing page. Never linked: while COMING_SOON_ENABLED is on,
 * the proxy serves it in place of "/" (a rewrite, the address bar keeps "/"),
 * and it sends "/coming-soon" itself back to "/" (see src/proxy.ts).
 *
 * It sits outside the (main) group so it carries none of the marketplace
 * chrome: ComingSoon has its own nav and footer.
 */
export const metadata = createMetadata({
  title: "SUGU — La plus grande marketplace africaine arrive",
  description:
    "Quelque chose d'immense arrive. Découvrez des produits authentiques, une livraison rapide. Inscrivez-vous sur la liste VIP pour le lancement !",
  path: "/",
  image: "https://cdn.sugu.pro/p/sugu_logo.png",
});

export default function ComingSoonPage() {
  return <ComingSoon />;
}
