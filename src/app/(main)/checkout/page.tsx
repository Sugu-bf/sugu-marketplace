import { redirect } from "next/navigation";
import { createMetadata } from "@/lib/metadata";
import { Container, Breadcrumb, Stepper } from "@/components/ui";
import type { StepperStep } from "@/components/ui";
import { getAuthUser } from "@/lib/api/auth";
import { queryCheckoutSession } from "@/features/checkout";
import { CheckoutOrchestrator } from "@/features/checkout/components/CheckoutOrchestrator";
import { CheckoutError } from "@/features/checkout/components/CheckoutError";

// Checkout is user-specific (auth + session) — never prerender
export const dynamic = "force-dynamic";

// ─── SEO Metadata ────────────────────────────────────────────

export const metadata = createMetadata({
  title: "Paiement",
  description: "Finalisez votre commande sur Sugu. Livraison rapide et paiement sécurisé.",
  path: "/checkout",
  noIndex: true,
});

// ─── Stepper config ──────────────────────────────────────────

const CHECKOUT_STEPS: StepperStep[] = [
  { id: "cart", label: "Panier" },
  { id: "address", label: "Adresse" },
  { id: "shipping", label: "Livraison" },
  { id: "payment", label: "Paiement" },
];

// ─── Derive step progress from session state ─────────────────

function getStepProgress(session: { totals: { shipping_amount: number } } | null) {
  if (!session) return { currentStepId: "cart" as const, completedStepIds: [] as string[] };

  const completedSteps: string[] = ["cart", "address"];
  let currentStep = "shipping";

  if (session.totals.shipping_amount > 0) {
    completedSteps.push("shipping");
    currentStep = "payment";
  }

  return { currentStepId: currentStep, completedStepIds: completedSteps };
}

// ─── Page Component (Server) ─────────────────────────────────

interface CheckoutPageProps {
  searchParams: Promise<{ session?: string }>;
}

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  // ── AUTH GATE: Guests cannot checkout ──
  // They must create an account or login first.
  const user = await getAuthUser();

  if (!user) {
    // Redirect to login with return URL
    redirect("/login?redirect=/checkout");
  }

  const params = await searchParams;
  const sessionId = params.session;

  // No session ID → redirect suggestion
  if (!sessionId) {
    return (
      <main className="pb-12">
        <Container className="pt-8">
          <CheckoutError
            title="Session manquante"
            message="Aucune session de paiement trouvée. Veuillez d'abord ajouter des articles à votre panier."
            linkHref="/cart"
            linkLabel="Retour au panier"
          />
        </Container>
      </main>
    );
  }

  // Fetch checkout data from backend (no-store, SSR)
  const result = await queryCheckoutSession(sessionId);

  // Error fetching session
  if (result.error || !result.session) {
    return (
      <main className="pb-12">
        <Container className="pt-8">
          <CheckoutError
            title="Session invalide"
            message={result.error || "La session de paiement est invalide ou a expiré."}
            linkHref="/cart"
            linkLabel="Retour au panier"
          />
        </Container>
      </main>
    );
  }

  const { currentStepId, completedStepIds } = getStepProgress(result.session);

  const breadcrumbItems = [
    { label: "Panier", href: "/cart" },
    { label: "Paiement" },
  ];

  return (
    <main className="pb-12">
      {/* Breadcrumb */}
      <Container className="pt-4 pb-2">
        <Breadcrumb items={breadcrumbItems} />
      </Container>

      {/* Page Header */}
      <Container className="pb-4">
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
          Paiement
        </h1>
      </Container>

      {/* Checkout Stepper */}
      <Container className="pb-8">
        <Stepper
          steps={CHECKOUT_STEPS}
          currentStepId={currentStepId}
          completedStepIds={completedStepIds}
        />
      </Container>

      {/* Checkout Content */}
      <Container>
        <CheckoutOrchestrator
          session={result.session}
          partners={result.partners}
          zones={result.zones}
          sessionId={sessionId}
        />
      </Container>
    </main>
  );
}
