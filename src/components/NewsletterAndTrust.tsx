"use client";

import { useState } from "react";
import Image from "next/image";
import { Truck, Award, ShieldCheck, Headphones } from "lucide-react";
import { Container } from "@/components/ui";
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

  return (
    <Container
      as="section"
      className="py-8"
      style={{ animation: "fadeSlideUp 0.5s ease-out 200ms both" }}
    >
      {/* ── Newsletter Banner ── */}
      <div
        className="relative overflow-hidden rounded-2xl mb-6"
        style={{
          background: "#EDEAE6",
          animation: "fadeSlideUp 0.5s ease-out 150ms both",
        }}
      >
        <div className="flex flex-col md:flex-row items-center">
          {/* Left content */}
          <div className="flex-1 p-8 md:p-10 lg:p-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground leading-snug mb-6 max-w-md">
              Restez chez vous et recevez vos besoins quotidiens de notre boutique
            </h2>

            {/* Email form */}
            <div className="flex items-center gap-0 mb-3 max-w-md">
              <label htmlFor="newsletter-email" className="sr-only">
                Adresse email
              </label>
              <input
                id="newsletter-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Entrez votre email"
                className="flex-1 rounded-l-full border-2 border-r-0 border-border bg-white px-5 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary/40 transition-all duration-200"
              />
              <button className="rounded-r-full bg-primary px-5 py-2.5 border-2 border-primary text-sm font-bold text-white transition-all duration-200 hover:bg-primary-dark active:scale-95 whitespace-nowrap">
                S&apos;abonner maintenant
              </button>
            </div>

            <p className="text-[11px] text-muted-foreground max-w-md">
              J&apos;accepte que mes données soumises soient collectées et stockées.
            </p>
          </div>

          {/* Right image */}
          <div className="relative w-full md:w-[320px] lg:w-[380px] h-[200px] md:h-[260px] flex-shrink-0">
            <Image
              src="/promos/newsletter-grocery.png"
              alt="Panier de courses"
              fill
              className="object-contain object-center md:object-right-bottom"
              sizes="380px"
            />
          </div>
        </div>
      </div>

      {/* ── Trust Badges ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {trustBadges.map((badge, index) => {
          const IconComp = iconMap[badge.iconName];
          return (
            <div
              key={badge.title}
              className="flex items-center gap-4 rounded-2xl bg-primary-100 px-5 py-4 transition-all duration-300 hover:shadow-md cursor-default"
              style={{
                animation: `fadeSlideUp 0.4s ease-out ${300 + index * 80}ms both`,
              }}
            >
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-primary/15">
                <IconComp size={20} className="text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">{badge.title}</p>
                <p className="text-[11px] text-muted-foreground">{badge.subtitle}</p>
              </div>
            </div>
          );
        })}
      </div>
    </Container>
  );
}
