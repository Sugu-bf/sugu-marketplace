"use client";

import Image from "next/image";
import { Container } from "@/components/ui";
import type { BannerSlide } from "@/features/home";

interface SmallBannersProps {
  slides: BannerSlide[];
}

export default function SmallBanners({ slides }: SmallBannersProps) {
  if (!slides || slides.length === 0) return null;

  return (
    <Container as="section" className="py-4 animate-fade-slide-up">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className="group relative aspect-[2.2/1] overflow-hidden rounded-2xl shadow-md transition-all duration-500 hover:shadow-xl hover:scale-[1.02]"
            style={{
              animation: `fadeSlideUp 0.6s ease-out ${index * 150}ms both`,
            }}
          >
            <Image
              src={slide.image}
              alt={slide.alt}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, 33vw"
              priority={index === 0}
            />
            {/* Shimmer overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
          </div>
        ))}
      </div>
    </Container>
  );
}
