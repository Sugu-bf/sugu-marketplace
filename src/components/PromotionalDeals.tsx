"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui";
import { calculateTimeLeft } from "@/components/ui/countdown-timer";
import { useSecondClock } from "@/lib/hydration";
import type { PromotionalDeal } from "@/features/home";

interface PromotionalDealsProps {
  deals: PromotionalDeal[];
}

function CountdownBox({
  value,
  label,
  variant,
}: {
  /** null until the browser clock is read: "--". */
  value: number | null;
  label: string;
  variant: "light" | "dark";
}) {
  const isLight = variant === "light";
  return (
    <div className="flex items-center gap-1">
      <div
        className={`flex items-center justify-center min-w-[40px] h-[32px] rounded-md text-sm font-bold ${
          isLight
            ? "border border-border bg-white text-foreground"
            : "bg-primary text-white"
        }`}
      >
        {value ?? "--"} {label}
      </div>
    </div>
  );
}

export default function PromotionalDeals({ deals }: PromotionalDealsProps) {
  // Counted down in the browser from the end date: computed on the server,
  // the remaining time was frozen in the cached page.
  const now = useSecondClock();

  return (
    <Container
      as="section"
      className="py-6"
      style={{ animation: "fadeSlideUp 0.5s ease-out 200ms both" }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {deals.map((deal, index) => {
          const c = deal.endsAt && now !== null ? calculateTimeLeft(deal.endsAt, now) : null;
          const isLight = deal.variant === "light";
          const href = deal.href || "/search";

          return (
            <Link
              key={deal.id}
              href={href}
              className={`group relative overflow-hidden rounded-2xl cursor-pointer transition-all duration-500 hover:shadow-xl block ${
                isLight
                  ? "bg-white border border-border-light shadow-sm"
                  : "bg-gray-900"
              }`}
              style={{
                height: "180px",
                animation: `fadeSlideUp 0.5s ease-out ${200 + index * 150}ms both`,
              }}
            >
              {/* Image */}
              {isLight ? (
                <div className="absolute left-0 top-0 w-[40%] h-full">
                  <Image
                    src={deal.image}
                    alt={deal.title}
                    fill
                    className="object-cover object-center"
                    sizes="300px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-l from-white via-white/60 to-transparent" />
                </div>
              ) : (
                <div className="absolute inset-0">
                  <Image
                    src={deal.image}
                    alt={deal.title}
                    fill
                    className="object-cover object-center"
                    sizes="600px"
                  />
                  <div className="absolute inset-0 bg-black/30" />
                </div>
              )}

              {/* Content */}
              <div
                className={`relative z-10 flex flex-col justify-center h-full ${
                  isLight ? "pl-[38%] pr-6" : "pl-6 pr-6"
                }`}
              >
                <h3
                  className={`text-lg sm:text-xl font-bold mb-1 ${
                    isLight ? "text-foreground" : "text-white"
                  }`}
                >
                  {deal.title}
                </h3>
                <p
                  className={`text-xs mb-3 ${
                    isLight ? "text-muted-foreground" : "text-white/80"
                  }`}
                >
                  {deal.subtitle}
                </p>

                {/* Countdown */}
                {deal.endsAt && (
                  <div className="flex items-center gap-1.5 mb-3" aria-label="Compte à rebours">
                    <CountdownBox value={c?.days ?? null} label="J" variant={deal.variant} />
                    <span className={`text-sm font-bold ${isLight ? "text-muted-foreground" : "text-white/60"}`}>:</span>
                    <CountdownBox value={c?.hours ?? null} label="H" variant={deal.variant} />
                    <span className={`text-sm font-bold ${isLight ? "text-muted-foreground" : "text-white/60"}`}>:</span>
                    <CountdownBox value={c?.minutes ?? null} label="M" variant={deal.variant} />
                    <span className={`text-sm font-bold ${isLight ? "text-muted-foreground" : "text-white/60"}`}>:</span>
                    <CountdownBox value={c?.seconds ?? null} label="S" variant={deal.variant} />
                  </div>
                )}

                {/* Shop Now */}
                <span className="group/btn inline-flex items-center gap-1.5 w-fit rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white transition-all duration-300 group-hover:bg-primary-dark group-hover:shadow-lg group-hover:shadow-primary/25">
                  Acheter
                  <ArrowRight
                    size={14}
                    className="transition-transform duration-300 group-hover/btn:translate-x-1"
                  />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </Container>
  );
}
