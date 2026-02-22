"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui";
import type { PromotionalDeal, Countdown } from "@/features/home";

interface PromotionalDealsProps {
  deals: PromotionalDeal[];
}

function CountdownBox({
  value,
  label,
  variant,
}: {
  value: number;
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
        {value} {label}
      </div>
    </div>
  );
}

export default function PromotionalDeals({ deals }: PromotionalDealsProps) {
  const [countdowns, setCountdowns] = useState<Countdown[]>(
    deals.map((d) => ({ ...d.countdown }))
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdowns((prev) =>
        prev.map((c) => {
          let { days, hours, minutes, seconds } = c;
          seconds--;
          if (seconds < 0) {
            seconds = 59;
            minutes--;
          }
          if (minutes < 0) {
            minutes = 59;
            hours--;
          }
          if (hours < 0) {
            hours = 23;
            days--;
          }
          if (days < 0) days = 0;
          return { days, hours, minutes, seconds };
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Container
      as="section"
      className="py-6"
      style={{ animation: "fadeSlideUp 0.5s ease-out 200ms both" }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {deals.map((deal, index) => {
          const c = countdowns[index];
          const isLight = deal.variant === "light";

          return (
            <div
              key={deal.id}
              className={`group relative overflow-hidden rounded-2xl cursor-pointer transition-all duration-500 hover:shadow-xl ${
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
                {c && (
                  <div className="flex items-center gap-1.5 mb-3" aria-label="Compte à rebours">
                    <CountdownBox value={c.days} label="J" variant={deal.variant} />
                    <span className={`text-sm font-bold ${isLight ? "text-muted-foreground" : "text-white/60"}`}>:</span>
                    <CountdownBox value={c.hours} label="H" variant={deal.variant} />
                    <span className={`text-sm font-bold ${isLight ? "text-muted-foreground" : "text-white/60"}`}>:</span>
                    <CountdownBox value={c.minutes} label="M" variant={deal.variant} />
                    <span className={`text-sm font-bold ${isLight ? "text-muted-foreground" : "text-white/60"}`}>:</span>
                    <CountdownBox value={c.seconds} label="S" variant={deal.variant} />
                  </div>
                )}

                {/* Shop Now */}
                <button className="group/btn flex items-center gap-1.5 w-fit rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white transition-all duration-300 hover:bg-primary-dark hover:shadow-lg hover:shadow-primary/25 active:scale-95">
                  Acheter
                  <ArrowRight
                    size={14}
                    className="transition-transform duration-300 group-hover/btn:translate-x-1"
                  />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </Container>
  );
}
