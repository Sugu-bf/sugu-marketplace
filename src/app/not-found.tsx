import Link from "next/link";
import { createMetadata } from "@/lib/metadata";
import { Container } from "@/components/ui";

export const metadata = createMetadata({
  title: "Page non trouvée",
  description: "La page que vous recherchez n'existe pas ou a été déplacée.",
  noIndex: true,
});

export default function NotFound() {
  return (
    <Container
      as="main"
      className="flex min-h-[60vh] flex-col items-center justify-center py-20 text-center"
    >
      {/* Big 404 */}
      <h1 className="text-8xl font-black text-primary/20 sm:text-[12rem] leading-none select-none">
        404
      </h1>

      <h2 className="mt-4 text-2xl font-bold text-foreground sm:text-3xl">
        Oups ! Page introuvable
      </h2>
      <p className="mt-3 max-w-md text-muted-foreground">
        La page que vous recherchez n&apos;existe pas, a été déplacée ou est
        temporairement indisponible.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-primary-dark active:scale-95"
        >
          Retour à l&apos;accueil
        </Link>
        <Link
          href="/search"
          className="inline-flex items-center justify-center rounded-full border-2 border-border px-6 py-3 text-sm font-semibold text-foreground transition-all hover:border-primary/40 hover:text-primary"
        >
          Rechercher un produit
        </Link>
      </div>
    </Container>
  );
}
