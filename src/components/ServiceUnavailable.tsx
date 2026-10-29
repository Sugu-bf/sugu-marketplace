import Link from "next/link";
import { Container } from "@/components/ui/container";

interface ServiceUnavailableProps {
  /** Where "Réessayer" leads: the page the visitor asked for. */
  retryHref: string;
}

/**
 * Shown by a protected page when the backend cannot tell whether the visitor
 * is signed in (see getAuthState): neither the protected content nor a login
 * redirect the visitor does not need, but an honest "try again".
 */
export function ServiceUnavailable({ retryHref }: ServiceUnavailableProps) {
  return (
    <Container
      as="section"
      role="alert"
      className="flex min-h-[50vh] flex-col items-center justify-center py-16 text-center"
    >
      <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
        Service momentanément indisponible
      </h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        Nous n&apos;arrivons pas à vérifier votre session pour le moment. Vos données ne
        sont pas perdues : réessayez dans quelques instants.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href={retryHref}
          prefetch={false}
          className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-primary-dark"
        >
          Réessayer
        </Link>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-full border-2 border-border px-6 py-3 text-sm font-semibold text-foreground transition-all hover:border-primary/40 hover:text-primary"
        >
          Retour à l&apos;accueil
        </Link>
      </div>
    </Container>
  );
}
