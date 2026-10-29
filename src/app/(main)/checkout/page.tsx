import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createMetadata } from "@/lib/metadata";
import { Container, Breadcrumb, Stepper } from "@/components/ui";
import type { StepperStep } from "@/components/ui";
import { getAuthState } from "@/lib/api/auth";
import { ServiceUnavailable } from "@/components/ServiceUnavailable";
import { queryCheckoutSession, createCheckoutSession } from "@/features/checkout";
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
  searchParams: Promise<{ session?: string; payment_method?: string; renewed?: string }>;
}

/** The cart token this browser mirrors in a first-party cookie (guest carts). */
const CART_TOKEN_COOKIE = "sugu_cart_token";

/** Opens a session on the current cart; null when there is nothing to buy. */
async function openSession(cartToken: string | null): Promise<string | null> {
  try {
    const created = await createCheckoutSession({}, cartToken);
    return created?.sessionId ?? null;
  } catch {
    return null;
  }
}

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  // ── AUTH GATE: Guests cannot checkout ──
  // They must create an account or login first.
  const auth = await getAuthState();

  if (auth.status === "unauthenticated") {
    // Redirect to login with return URL
    redirect("/login?redirect=/checkout");
  }
  if (auth.status === "unavailable") {
    return <ServiceUnavailable retryHref="/checkout" />;
  }

  const params = await searchParams;
  const cartToken = (await cookies()).get(CART_TOKEN_COOKIE)?.value ?? null;
  const paymentQuery = params.payment_method === "ligdicash" ? "&payment_method=ligdicash" : "";

  // No session in the URL (redirected from login or direct nav): open one on
  // the cart and come back with its id, so a reload stays on that session.
  if (!params.session) {
    const opened = await openSession(cartToken);
    if (opened) {
      redirect(`/checkout?session=${opened}${paymentQuery}`);
    }

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

  const sessionId = params.session;
  const result = await queryCheckoutSession(sessionId, cartToken);

  // A session already placed leads to its order, never to a second checkout.
  if (result.session?.order) {
    redirect(`/track-order?order=${result.session.order.id}`);
  }

  // Expired, or opened before signing in: a new session is opened on the cart
  // and the page moves to it — once, never in a loop.
  if ((result.error || !result.session || result.session.is_active === false) && !params.renewed) {
    const opened = await openSession(cartToken);
    if (opened && opened !== sessionId) {
      redirect(`/checkout?session=${opened}${paymentQuery}&renewed=1`);
    }
  }

  // Error fetching session
  if (result.error || !result.session || result.session.is_active === false) {
    return (
      <main className="pb-12">
        <Container className="pt-8">
          <CheckoutError
            title="Session invalide"
            message="La session de paiement est invalide ou a expiré."
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
          initialPaymentMethod={params.payment_method === "ligdicash" ? "ligdicash" : "cod"}
        />
      </Container>
    </main>
  );
}
