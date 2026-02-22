"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Container } from "@/components/ui";
import type { BannerSlide, HeroBanner } from "@/features/home";

interface HeroBannersProps {
  slides: BannerSlide[];
  heroBanner: HeroBanner;
}

export default function HeroBanners({ slides, heroBanner }: HeroBannersProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const nextSlide = useCallback(() => {
    if (isAnimating || slides.length === 0) return;
    setIsAnimating(true);
    setCurrentSlide((prev) => (prev + 1) % slides.length);
    setTimeout(() => setIsAnimating(false), 500);
  }, [isAnimating, slides.length]);

  const prevSlide = useCallback(() => {
    if (isAnimating || slides.length === 0) return;
    setIsAnimating(true);
    setCurrentSlide(
      (prev) => (prev - 1 + slides.length) % slides.length
    );
    setTimeout(() => setIsAnimating(false), 500);
  }, [isAnimating, slides.length]);

  // Auto-slide
  useEffect(() => {
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [nextSlide]);

  return (
    <Container as="section" className="pt-4 animate-fade-slide-up">
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        {/* Top row: 3 small banners */}
        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
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

        {/* Large hero banner */}
        <div
          className="lg:col-span-3 group relative overflow-hidden rounded-2xl shadow-md transition-all duration-500 hover:shadow-xl"
          style={{ animation: "fadeSlideUp 0.6s ease-out 450ms both" }}
        >
          <div className="relative aspect-[4/1] sm:aspect-[5/1] lg:aspect-[6/1]">
            <Image
              src={heroBanner.image}
              alt={heroBanner.alt}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
              sizes="100vw"
            />
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
          </div>

          {/* Navigation arrows */}
          <button
            onClick={prevSlide}
            className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 shadow-lg backdrop-blur-sm transition-all duration-200 hover:bg-white hover:scale-110 active:scale-90 opacity-0 group-hover:opacity-100"
            aria-label="Bannière précédente"
          >
            <ChevronLeft size={18} className="text-muted-foreground" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 shadow-lg backdrop-blur-sm transition-all duration-200 hover:bg-white hover:scale-110 active:scale-90 opacity-0 group-hover:opacity-100"
            aria-label="Bannière suivante"
          >
            <ChevronRight size={18} className="text-muted-foreground" />
          </button>
        </div>
      </div>
    </Container>
  );
}
