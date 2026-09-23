"use client";

import { useState, useCallback } from "react";
import {
  Truck,
  Award,
  ShieldCheck,
  Headphones,
  Loader2,
  CheckCircle,
  Mail,
  Newspaper,
} from "lucide-react";
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

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (isSubmitting || !email.trim()) return;

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
    },
    [email, isSubmitting],
  );

  return (
    <Container
      as="section"
      className="py-8 sm:py-10"
      style={{ animation: "fadeSlideUp 0.5s ease-out 200ms both" }}
    >
      {/* Newsletter — same card language as home sections */}
      <div className="rounded-2xl border border-border-light bg-white p-5 sm:p-8 shadow-sm mb-6 sm:mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center gap-6 lg:gap-10">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <div className="hidden sm:flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Newspaper size={22} className="text-primary" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-bold text-foreground mb-1.5">
                Actualités &amp; offres Sugu
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">
                Recevez nos nouveautés, promotions et conseils directement dans votre boîte mail.
              </p>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="w-full lg:w-auto lg:min-w-[380px] flex flex-col gap-2"
          >
            <div className="flex flex-col sm:flex-row gap-2">
              <label htmlFor="newsletter-email" className="sr-only">
                Adresse email
              </label>
              <div className="relative flex-1">
                <Mail
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                />
                <input
                  id="newsletter-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Votre adresse email"
                  disabled={isSubmitting}
                  className="w-full rounded-full border border-border bg-background pl-10 pr-4 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all duration-200 disabled:opacity-60"
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:bg-primary-dark hover:shadow-lg hover:shadow-primary/25 active:scale-95 whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
            </div>

            {feedback && (
              <div
                className={`flex items-center gap-1.5 text-xs font-medium ${
                  feedback.type === "success" ? "text-green-600" : "text-error"
                }`}
              >
                {feedback.type === "success" && <CheckCircle size={14} />}
                {feedback.message}
              </div>
            )}

            <p className="text-[11px] text-muted-foreground">
              En vous abonnant, vous acceptez de recevoir nos communications. Désinscription possible à tout moment.
            </p>
          </form>
        </div>
      </div>

      {/* Trust badges — white cards like product sections */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {trustBadges.map((badge, index) => {
          const IconComp = iconMap[badge.iconName];
          return (
            <div
              key={badge.title}
              className="flex items-center gap-3 sm:gap-4 rounded-2xl border border-border-light bg-white px-4 sm:px-5 py-4 shadow-sm transition-all duration-300 hover:shadow-md hover:border-primary/20"
              style={{
                animation: `fadeSlideUp 0.4s ease-out ${250 + index * 60}ms both`,
              }}
            >
              <div className="flex h-10 w-10 sm:h-11 sm:w-11 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <IconComp size={18} className="text-primary" />
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
