"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { Truck, Award, ShieldCheck, Headphones, Loader2, CheckCircle } from "lucide-react";
import { Container } from "@/components/ui";
import { subscribeNewsletter } from "@/features/home";
import type { TrustBadge } from "@/features/home";

interface NewsletterAndTrustProps {
  trustBadges: TrustBadge[];
}

const iconMap = {
  truck: Truck,
  award: Award,
  "shield-check": ShieldCheck,
  headphones: Headphones,
} as const;

export default function NewsletterAndTrust({ trustBadges }: NewsletterAndTrustProps) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !email.trim()) return;

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setFeedback({ type: "error", message: "Veuillez entrer une adresse email valide." });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const result = await subscribeNewsletter(email);
      if (result.success) {
        setFeedback({
          type: "success",
          message: result.message || "Merci ! Vous êtes maintenant abonné.",
        });
        setEmail("");
      } else {
        setFeedback({
          type: "error",
          message: result.message || "Erreur lors de l'abonnement.",
        });
      }
    } catch {
      setFeedback({
        type: "error",
        message: "Erreur réseau. Veuillez réessayer.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [email, isSubmitting]);

  return (
    <Container
      as="section"
      className="py-6 sm:py-8 overflow-hidden"
      style={{ animation: "fadeSlideUp 0.5s ease-out 200ms both" }}
    >
      {/* ── Newsletter Banner ── */}
      <div
        className="relative overflow-hidden rounded-2xl mb-6 isolate"
        style={{
          background: "#EDEAE6",
          animation: "fadeSlideUp 0.5s ease-out 150ms both",
        }}
      >
        <div className="flex flex-col md:flex-row items-stretch">
          {/* Left content */}
          <div className="flex-1 flex flex-col justify-center p-5 sm:p-8 md:p-10 lg:p-12">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground leading-snug mb-4 sm:mb-6">
              Restez chez vous et recevez vos besoins quotidiens de notre boutique
            </h2>

            {/* Email form — stacked on mobile, row on sm+ */}
            <form
              onSubmit={handleSubmit}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-0 mb-3 max-w-md"
            >
              <label htmlFor="newsletter-email" className="sr-only">
                Adresse email
              </label>
              <input
                id="newsletter-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Entrez votre email"
                disabled={isSubmitting}
                className="flex-1 rounded-full sm:rounded-l-full sm:rounded-r-none border-2 sm:border-r-0 border-border bg-white px-5 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary/40 transition-all duration-200 disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-full sm:rounded-l-none sm:rounded-r-full bg-primary px-5 py-2.5 border-2 border-primary text-sm font-bold text-white transition-all duration-200 hover:bg-primary-dark active:scale-95 whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Envoi...
                  </>
                ) : (
                  "S'abonner"
                )}
              </button>
            </form>

            {/* Feedback */}
            {feedback && (
              <div
                className={`flex items-center gap-1.5 text-xs font-medium mb-2 ${
                  feedback.type === "success" ? "text-green-600" : "text-error"
                }`}
              >
                {feedback.type === "success" && <CheckCircle size={14} />}
                {feedback.message}
              </div>
            )}

            <p className="text-[11px] text-muted-foreground">
              J&apos;accepte que mes données soumises soient collectées et stockées.
            </p>
          </div>

          {/* Right image — hidden on mobile */}
          <div className="relative hidden sm:block w-full md:w-[320px] lg:w-[400px] h-[220px] md:h-auto flex-shrink-0 sm:rounded-b-2xl md:rounded-none md:rounded-r-2xl overflow-hidden isolate">
            <Image
              src="/promos/newsletter-grocery.png"
              alt="Panier de courses"
              fill
              className="object-cover object-center"
              sizes="(max-width: 768px) 100vw, 400px"
            />
          </div>
        </div>
      </div>

      {/* ── Trust Badges ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {trustBadges.map((badge, index) => {
          const IconComp = iconMap[badge.iconName];
          return (
            <div
              key={badge.title}
              className="flex items-center gap-3 sm:gap-4 rounded-2xl bg-primary-100 px-4 sm:px-5 py-3 sm:py-4 transition-all duration-300 hover:shadow-md cursor-default"
              style={{
                animation: `fadeSlideUp 0.4s ease-out ${300 + index * 80}ms both`,
              }}
            >
              <div className="flex h-10 w-10 sm:h-11 sm:w-11 flex-shrink-0 items-center justify-center rounded-full bg-primary/15">
                <IconComp size={18} className="text-primary sm:[&]:w-5 sm:[&]:h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-foreground">{badge.title}</p>
                <p className="text-[11px] text-muted-foreground truncate">{badge.subtitle}</p>
              </div>
            </div>
          );
        })}
      </div>
    </Container>
  );
}
