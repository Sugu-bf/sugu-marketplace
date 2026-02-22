import { createMetadata } from "@/lib/metadata";
import { Container, Breadcrumb, Stepper } from "@/components/ui";
import type { StepperStep } from "@/components/ui";
import { queryCheckoutData } from "@/features/checkout";
import { CheckoutOrchestrator } from "@/features/checkout/components/CheckoutOrchestrator";

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

// ─── Page Component (Server) ─────────────────────────────────

export default async function CheckoutPage() {
  const checkoutData = await queryCheckoutData();

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
          currentStepId={checkoutData.currentStep}
          completedStepIds={checkoutData.completedSteps}
        />
      </Container>

      {/* Checkout Content */}
      <Container>
        <CheckoutOrchestrator initialData={checkoutData} />
      </Container>
    </main>
  );
}
