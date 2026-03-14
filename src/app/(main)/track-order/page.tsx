import { createMetadata } from "@/lib/metadata";
import { Container, Breadcrumb } from "@/components/ui";
import { AssuranceBadge } from "@/components/ui/assurance-badge";
import { queryTrackedOrder } from "@/features/order";
import { TrackingLiveWrapper } from "@/features/order/components/TrackingLiveWrapper";
import { Lock, Truck, ShieldCheck, AlertTriangle, Search } from "lucide-react";
import { isApiError, type ApiErrorCode } from "@/lib/api";
import Link from "next/link";

// ─── SEO Metadata ────────────────────────────────────────────

export const metadata = createMetadata({
  title: "Suivre ma commande",
  description:
    "Suivez l'état de votre commande en temps réel sur Sugu. Livraison rapide et suivi détaillé.",
  path: "/track-order",
  noIndex: true,
});

// ─── Error UI ────────────────────────────────────────────────

function TrackingError({
  title,
  message,
  code,
}: {
  title: string;
  message: string;
  code?: ApiErrorCode | "MISSING_TOKEN";
}) {
  const showLoginLink = code === "UNAUTHORIZED" || code === "FORBIDDEN";

  return (
    <main className="pb-12">
      <Container className="pt-4 pb-2">
        <Breadcrumb items={[{ label: "Suivi de commande" }]} />
      </Container>
      <Container className="py-16">
        <div className="mx-auto max-w-md text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
            {code === "NOT_FOUND" || code === "MISSING_TOKEN" ? (
              <Search size={28} className="text-red-500" />
            ) : (
              <AlertTriangle size={28} className="text-red-500" />
            )}
          </div>
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          <p className="mt-2 text-muted-foreground">{message}</p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            {showLoginLink ? (
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark transition-colors"
              >
                Se connecter
              </Link>
            ) : (
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark transition-colors"
              >
                Retour à l&apos;accueil
              </Link>
            )}
            <Link
              href="/account"
              className="inline-flex items-center justify-center rounded-xl border border-border px-6 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              Mes commandes
            </Link>
          </div>
        </div>
      </Container>
    </main>
  );
}

// ─── Page Component (Server) ─────────────────────────────────

interface TrackOrderPageProps {
  searchParams: Promise<{ order?: string; id?: string }>;
}

export default async function TrackOrderPage({
  searchParams,
}: TrackOrderPageProps) {
  const params = await searchParams;
  const orderId = params.order || params.id;

  // ─ Validate token presence ─────────────────────────────────
  if (!orderId || orderId.trim().length === 0) {
    return (
      <TrackingError
        code="MISSING_TOKEN"
        title="Commande introuvable"
        message="Aucun numéro de commande n'a été fourni. Vérifiez le lien ou consultez vos commandes."
      />
    );
  }

  // ─ Validate token format (ULIDs are 26 chars, alphanumeric) ─
  if (!/^[0-9a-z]{20,30}$/i.test(orderId)) {
    return (
      <TrackingError
        code="MISSING_TOKEN"
        title="Lien invalide"
        message="Le lien de suivi semble invalide. Vérifiez que vous avez copié l'URL complète."
      />
    );
  }

  // ─ Fetch order data (SSR, no-store) ────────────────────────
  try {
    const order = await queryTrackedOrder(orderId);

    return (
      <main className="pb-12">
        {/* Breadcrumb */}
        <Container className="pt-4 pb-2">
          <Breadcrumb items={[{ label: "Suivi de commande" }]} />
        </Container>

        {/* Live tracking content */}
        <Container className="pb-6">
          <TrackingLiveWrapper orderId={orderId} initialData={order} />
        </Container>

        {/* Trust Badges */}
        <Container className="pt-10 mt-8 border-t border-border-light">
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
            <AssuranceBadge
              icon={<Lock size={16} />}
              label="Paiement sécurisé"
              className="border-none bg-transparent"
            />
            <AssuranceBadge
              icon={<Truck size={16} />}
              label="Suivi en temps réel"
              className="border-none bg-transparent"
            />
            <AssuranceBadge
              icon={<ShieldCheck size={16} />}
              label="Fraîcheur garantie"
              className="border-none bg-transparent"
            />
          </div>
        </Container>
      </main>
    );
  } catch (error) {
    // ─ Handle specific API errors ──────────────────────────────
    if (isApiError(error)) {
      if (error.code === "NOT_FOUND") {
        return (
          <TrackingError
            code="NOT_FOUND"
            title="Commande introuvable"
            message="Cette commande n'existe pas ou le lien a expiré."
          />
        );
      }

      if (error.code === "UNAUTHORIZED" || error.code === "FORBIDDEN") {
        return (
          <TrackingError
            code={error.code}
            title="Accès refusé"
            message="Vous devez vous connecter pour accéder à cette commande."
          />
        );
      }

      if (error.code === "RATE_LIMITED") {
        return (
          <TrackingError
            code="RATE_LIMITED"
            title="Trop de requêtes"
            message="Veuillez patienter quelques instants avant de réessayer."
          />
        );
      }
    }

    // ─ Generic error fallback ──────────────────────────────────
    return (
      <TrackingError
        title="Erreur de chargement"
        message="Impossible de charger les informations de suivi. Veuillez réessayer."
      />
    );
  }
}
