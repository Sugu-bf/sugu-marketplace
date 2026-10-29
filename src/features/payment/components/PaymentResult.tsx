"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Headphones,
  Loader2,
  LogIn,
  Package,
  RefreshCw,
  Search,
  ShieldCheck,
  ShoppingBag,
  XCircle,
} from "lucide-react";
import { buttonVariants } from "@/components/ui";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/constants";
import { usePaymentStatus } from "../hooks/usePaymentStatus";
import type { PaymentStatus } from "../api/payment.schemas";

// ─── Layout ───────────────────────────────────────────────────

function ResultLayout({
  icon,
  iconClassName,
  title,
  children,
  actions,
}: {
  icon: ReactNode;
  iconClassName: string;
  title: string;
  children: ReactNode;
  actions: ReactNode;
}) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6" aria-live="polite">
        <div
          className={cn(
            "relative mx-auto flex h-20 w-20 items-center justify-center rounded-full shadow-lg",
            iconClassName
          )}
        >
          {icon}
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{title}</h1>
          {children}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">{actions}</div>
      </div>
    </div>
  );
}

const primaryAction = cn(
  buttonVariants({ variant: "primary", size: "lg", pill: true }),
  "w-full sm:w-auto shadow-lg shadow-primary/20"
);
const secondaryAction = cn(
  buttonVariants({ variant: "outline", size: "lg", pill: true }),
  "w-full sm:w-auto"
);

function OrdersAction({ primary = true }: { primary?: boolean }) {
  return (
    <Link href="/account/orders" className={primary ? primaryAction : secondaryAction}>
      <Package size={18} />
      Voir mes commandes
      <ArrowRight size={16} />
    </Link>
  );
}

function ShopAction({ label = "Continuer mes achats" }: { label?: string }) {
  return (
    <Link href="/" className={secondaryAction}>
      <ShoppingBag size={18} />
      {label}
    </Link>
  );
}

function Lead({ children }: { children: ReactNode }) {
  return <p className="text-muted-foreground text-sm sm:text-base">{children}</p>;
}

function forOrder(payment: PaymentStatus | null): string {
  return payment ? ` pour la commande n° ${payment.order_number}` : "";
}

// ─── States ───────────────────────────────────────────────────

function CheckingView({ payment }: { payment: PaymentStatus | null }) {
  return (
    <ResultLayout
      icon={<Loader2 size={40} className="text-primary animate-spin" strokeWidth={2.5} />}
      iconClassName="bg-primary-50 shadow-primary/10"
      title="Paiement en cours de vérification"
      actions={<OrdersAction primary={false} />}
    >
      <Lead>
        Nous attendons la confirmation de votre paiement{forOrder(payment)}. Cela ne prend
        généralement que quelques secondes, ne fermez pas cette page.
      </Lead>
    </ResultLayout>
  );
}

function StillProcessingView({ payment }: { payment: PaymentStatus | null }) {
  return (
    <ResultLayout
      icon={<Clock size={40} className="text-white" strokeWidth={2.5} />}
      iconClassName="bg-gradient-to-br from-amber-400 to-orange-500 shadow-amber-500/30"
      title="Paiement toujours en cours"
      actions={
        <>
          <OrdersAction />
          <ShopAction />
        </>
      }
    >
      <Lead>
        La confirmation de votre paiement{forOrder(payment)} prend plus de temps que prévu.
        Vous serez notifié dès qu&apos;elle arrivera ; vous pouvez aussi suivre votre commande
        depuis vos commandes.
      </Lead>
    </ResultLayout>
  );
}

function SucceededView({ payment }: { payment: PaymentStatus }) {
  return (
    <ResultLayout
      icon={<CheckCircle2 size={40} className="text-white" strokeWidth={2.5} />}
      iconClassName="bg-gradient-to-br from-green-400 to-emerald-500 shadow-green-500/30"
      title="Paiement confirmé !"
      actions={
        <>
          <OrdersAction />
          <ShopAction />
        </>
      }
    >
      <Lead>
        Votre paiement de {formatPrice(payment.amount)} pour la commande n°{" "}
        {payment.order_number} a été confirmé.
      </Lead>
      <p className="text-xs text-muted-foreground/70">
        Un email de confirmation vous sera envoyé sous peu.
      </p>
    </ResultLayout>
  );
}

function UnderReviewView({ payment }: { payment: PaymentStatus }) {
  return (
    <ResultLayout
      icon={<ShieldCheck size={40} className="text-white" strokeWidth={2.5} />}
      iconClassName="bg-gradient-to-br from-sky-400 to-blue-500 shadow-blue-500/30"
      title="Paiement en cours de vérification par notre équipe"
      actions={
        <>
          <OrdersAction />
          <ShopAction />
        </>
      }
    >
      <Lead>
        Votre paiement pour la commande n° {payment.order_number} fait l&apos;objet d&apos;une
        vérification par notre équipe. Vous serez notifié dès qu&apos;elle sera terminée, aucune
        action n&apos;est nécessaire de votre part.
      </Lead>
    </ResultLayout>
  );
}

function FailedView() {
  return (
    <ResultLayout
      icon={<XCircle size={40} className="text-white" strokeWidth={2.5} />}
      iconClassName="bg-gradient-to-br from-red-400 to-rose-500 shadow-red-500/30"
      title="Paiement non abouti"
      actions={
        <>
          <Link href="/account/orders" className={primaryAction}>
            <RefreshCw size={18} />
            Voir mes commandes
            <ArrowRight size={16} />
          </Link>
          <ShopAction label="Retour à la boutique" />
        </>
      }
    >
      <Lead>
        Le paiement n&apos;a pas pu être finalisé. Aucun montant n&apos;a été débité de votre
        compte.
      </Lead>
      <div className="pt-4">
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 text-left">
          <p className="text-sm font-medium text-amber-800 mb-2">Causes possibles :</p>
          <ul className="text-xs text-amber-700 space-y-1.5">
            <li className="flex items-start gap-2">
              <span className="mt-0.5">•</span>
              <span>Solde insuffisant sur votre compte mobile money</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5">•</span>
              <span>Transaction annulée manuellement</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5">•</span>
              <span>Délai d&apos;attente dépassé (timeout)</span>
            </li>
          </ul>
        </div>
      </div>
      <div className="pt-4">
        <Link
          href="/support-chat"
          className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary-dark transition-colors"
        >
          <Headphones size={14} />
          Besoin d&apos;aide ? Contactez le support
        </Link>
      </div>
    </ResultLayout>
  );
}

function LoginView({ returnTo }: { returnTo: string }) {
  return (
    <ResultLayout
      icon={<LogIn size={40} className="text-primary" strokeWidth={2.5} />}
      iconClassName="bg-primary-50 shadow-primary/10"
      title="Connectez-vous pour voir votre paiement"
      actions={
        <Link href={`/login?redirect=${encodeURIComponent(returnTo)}`} className={primaryAction}>
          <LogIn size={18} />
          Se connecter
        </Link>
      }
    >
      <Lead>
        Cette commande est liée à un compte. Connectez-vous pour connaître l&apos;état de son
        paiement.
      </Lead>
    </ResultLayout>
  );
}

function UnknownPaymentView() {
  return (
    <ResultLayout
      icon={<Search size={40} className="text-muted-foreground" strokeWidth={2.5} />}
      iconClassName="bg-muted shadow-black/5"
      title="État du paiement indisponible"
      actions={
        <>
          <OrdersAction />
          <ShopAction />
        </>
      }
    >
      <Lead>
        Nous ne pouvons pas afficher l&apos;état de ce paiement depuis ce lien. Retrouvez votre
        commande et son paiement dans vos commandes.
      </Lead>
    </ResultLayout>
  );
}

// ─── Component ────────────────────────────────────────────────

interface PaymentResultProps {
  /** The opaque `ref` the provider appended to the return URL. */
  paymentRef: string | null;
  /**
   * The page the provider sent the buyer back to. It only decides what is
   * shown when the payment cannot be looked up: the failure page keeps its
   * failure message, the success page claims nothing.
   */
  landing: "success" | "failed";
  /** This page's path and query, to come back to after logging in. */
  returnTo: string;
}

/**
 * The outcome of an online payment, as the API knows it — never as the
 * provider's return URL suggests. « Paiement confirmé » is shown only for a
 * succeeded payment, whichever page the buyer landed on.
 */
export function PaymentResult({ paymentRef, landing, returnTo }: PaymentResultProps) {
  const state = usePaymentStatus(paymentRef);

  switch (state.kind) {
    case "checking":
      return <CheckingView payment={state.payment} />;
    case "timed_out":
      return <StillProcessingView payment={state.payment} />;
    case "succeeded":
      return <SucceededView payment={state.payment} />;
    case "under_review":
      return <UnderReviewView payment={state.payment} />;
    case "failed":
      return <FailedView />;
    case "unauthorized":
      return <LoginView returnTo={returnTo} />;
    case "not_found":
    case "missing_ref":
      return landing === "failed" ? <FailedView /> : <UnknownPaymentView />;
  }
}
