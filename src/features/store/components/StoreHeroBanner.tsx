import Image from "next/image";
import { MapPin, MessageCircle, Star, CalendarDays } from "lucide-react";
import { Container } from "@/components/ui";
import type { Store } from "../models/store";
import FollowButton from "./FollowButton";

interface StoreHeroBannerProps {
  store: Store;
  /** Store ULID — needed by FollowButton for API calls */
  storeId: string;
  /** Whether the current user follows this store */
  isFollowed: boolean;
}

/**
 * Store hero banner — Server Component.
 * Displays the cover image, store profile card with logo, stats, category pills,
 * and action buttons (Contacter / Suivre).
 */
export default function StoreHeroBanner({ store, storeId, isFollowed }: StoreHeroBannerProps) {
  // Extract initials for logo fallback
  const initials = store.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <section>
      {/* ─── Cover Image ──────────────────────────────────────── */}
      <Container>
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-900 via-blue-800 to-teal-600 h-[180px] sm:h-[240px]">
          {/* Decorative pattern overlay */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(255,255,255,0.2)_0%,transparent_60%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_30%,rgba(255,255,255,0.15)_0%,transparent_50%)]" />
          </div>

          {/* Cover image if available */}
          {store.coverUrl && (
            <Image
              src={store.coverUrl}
              alt={`Couverture ${store.name}`}
              fill
              className="object-cover mix-blend-overlay opacity-30"
              sizes="(max-width: 1400px) 100vw, 1400px"
              priority
            />
          )}

          {/* Title overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight uppercase">
              {store.name}
            </h1>
            <p className="mt-2 text-sm sm:text-base text-white/70 font-medium">
              Votre partenaire tech de confiance
            </p>
          </div>
        </div>
      </Container>

      {/* ─── Profile Card (overlaps cover) ────────────────────── */}
      <Container>
        <div className="relative mx-0 sm:mx-4 rounded-2xl bg-white shadow-md border border-border-light p-4 sm:p-6 sm:pt-5">
          {/* ── Row 1: Logo + Name/Location + Stats ──────────── */}
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            {/* Logo — overlaps cover on desktop */}
            <div className="relative -mt-14 sm:-mt-16 flex-shrink-0 self-start">
              <div className="relative h-[80px] w-[80px] sm:h-[90px] sm:w-[90px] rounded-full border-4 border-white shadow-lg bg-primary flex items-center justify-center overflow-hidden">
                {store.logoUrl ? (
                  <Image
                    src={store.logoUrl}
                    alt={store.name}
                    fill
                    className="object-cover"
                    sizes="90px"
                  />
                ) : (
                  <span className="text-2xl sm:text-3xl font-black text-white">
                    {initials}
                  </span>
                )}
              </div>
            </div>

            {/* Name + Location */}
            <div className="min-w-0 flex-shrink-0">
              <h2 className="text-lg sm:text-xl font-bold text-foreground">
                {store.name}
              </h2>
              <div className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin size={14} className="text-primary flex-shrink-0" />
                <span>{store.location}</span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Membre depuis {store.memberSince}
              </p>
            </div>

            {/* Stats — pushed to the right on desktop */}
            <div className="flex items-center gap-5 sm:gap-6 sm:ml-auto flex-wrap">
              {/* Rating */}
              <div className="flex items-center gap-1.5">
                <Star size={16} className="fill-amber-400 text-amber-400" />
                <span className="text-lg font-bold text-foreground">{store.rating}</span>
                <span className="text-xs text-muted-foreground">
                  ({store.reviewCount} avis)
                </span>
              </div>

              {/* Separator */}
              <div className="hidden sm:block w-px h-8 bg-border" />

              {/* Products */}
              <div className="text-center">
                <p className="text-lg font-bold text-foreground">
                  {store.totalProducts.toLocaleString("fr-FR")}
                </p>
                <p className="text-xs text-muted-foreground">produits</p>
              </div>

              {/* Sales */}
              <div className="text-center">
                <p className="text-lg font-bold text-foreground">
                  {store.totalSales.toLocaleString("fr-FR")}
                </p>
                <p className="text-xs text-muted-foreground">ventes</p>
              </div>

              {/* Member since */}
              <div className="hidden sm:flex flex-col items-center">
                <CalendarDays size={14} className="text-muted-foreground mb-0.5" />
                <p className="text-xs text-muted-foreground leading-tight">Membre</p>
                <p className="text-xs text-muted-foreground leading-tight">depuis {store.memberSince}</p>
              </div>
            </div>
          </div>

          {/* ── Row 2: Category pills (left) + Buttons (right) ── */}
          <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            {/* Category pills — left */}
            <div className="flex flex-wrap gap-2">
              {store.categories.map((cat) => (
                <span
                  key={cat.id}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground transition-colors duration-200 hover:border-primary/40 hover:text-primary cursor-pointer"
                >
                  {cat.icon && <span>{cat.icon}</span>}
                  {cat.name}
                </span>
              ))}
            </div>

            {/* Action Buttons — right */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <button className="inline-flex items-center gap-2 rounded-full border border-border px-4 sm:px-5 py-2 text-sm font-medium text-foreground transition-all duration-200 hover:border-primary/40 hover:bg-primary-50 hover:text-primary">
                <MessageCircle size={16} />
                Contacter
              </button>
              <FollowButton
                storeId={storeId}
                initialIsFollowed={isFollowed}
                initialFollowerCount={store.followerCount}
              />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
