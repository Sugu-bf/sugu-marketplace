"use client";

import Image from "next/image";
import { Container } from "@/components/ui";
import type { HeroBanner } from "@/features/home";

interface HeroBannersProps {
  heroBanner: HeroBanner;
}

export default function HeroBanners({ heroBanner }: HeroBannersProps) {
  return (
    <Container as="section" className="pt-4 animate-fade-slide-up">
      <div className="group relative overflow-hidden rounded-2xl shadow-md transition-all duration-500 hover:shadow-xl">
        <div className="relative aspect-[4/1] sm:aspect-[5/1] lg:aspect-[6/1]">
          <Image
            src={heroBanner.image}
            alt={heroBanner.alt}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
            sizes="100vw"
            priority
          />
          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
        </div>
      </div>
    </Container>
  );
}
