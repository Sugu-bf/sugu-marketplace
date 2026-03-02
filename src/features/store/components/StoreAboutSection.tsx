import { MapPin, Phone, Clock, Mail, Star, ChevronRight } from "lucide-react";
import { StarRating } from "@/components/ui";
import type { Store } from "../models/store";

interface StoreAboutSectionProps {
  store: Store;
}

/**
 * Store about section — Server Component.
 * Left column: description + contact info.
 * Right column: rating distribution + recent reviews.
 */
export default function StoreAboutSection({ store }: StoreAboutSectionProps) {
  const dist = store.ratingDistribution;
  const ratingBars = [
    { stars: 5, pct: dist.stars5 },
    { stars: 4, pct: dist.stars4 },
    { stars: 3, pct: dist.stars3 },
    { stars: 2, pct: dist.stars2 },
    { stars: 1, pct: dist.stars1 },
  ];

  return (
    <div className="rounded-2xl border border-border-light bg-white p-5 sm:p-8 shadow-sm">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* ─── Left: About ─────────────────────────────────────── */}
        <div className="lg:col-span-3 space-y-5">
          <h3 className="text-lg font-bold text-foreground">
            À propos de {store.name}
          </h3>

          <p className="text-sm text-muted-foreground leading-relaxed">
            {store.description}
          </p>

          {/* Contact Info */}
          <div className="space-y-3 pt-2">
            {store.contact.address && (
              <div className="flex items-start gap-3">
                <MapPin size={16} className="text-primary flex-shrink-0 mt-0.5" />
                <span className="text-sm text-foreground">
                  {store.contact.address}
                </span>
              </div>
            )}
            {store.contact.phone && (
              <div className="flex items-center gap-3">
                <Phone size={16} className="text-primary flex-shrink-0" />
                <a
                  href={`tel:${store.contact.phone}`}
                  className="text-sm text-foreground hover:text-primary transition-colors duration-200"
                >
                  {store.contact.phone}
                </a>
              </div>
            )}
            {store.contact.hours && (
              <div className="flex items-center gap-3">
                <Clock size={16} className="text-primary flex-shrink-0" />
                <span className="text-sm text-foreground">
                  {store.contact.hours}
                </span>
              </div>
            )}
            {store.contact.email && (
              <div className="flex items-center gap-3">
                <Mail size={16} className="text-primary flex-shrink-0" />
                <a
                  href={`mailto:${store.contact.email}`}
                  className="text-sm text-foreground hover:text-primary transition-colors duration-200"
                >
                  {store.contact.email}
                </a>
              </div>
            )}
          </div>
        </div>

        {/* ─── Right: Reviews ──────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">
          <h3 className="text-lg font-bold text-foreground">Avis clients</h3>

          {/* Overall rating */}
          <div className="flex items-center gap-3">
            <StarRating rating={store.rating} size="lg" showValue />
            <span className="text-sm text-muted-foreground">
              / 5 ({store.reviewCount} avis)
            </span>
          </div>

          {/* Rating bars */}
          <div className="space-y-2">
            {ratingBars.map((bar) => (
              <div key={bar.stars} className="flex items-center gap-2.5">
                <span className="flex items-center gap-0.5 text-xs text-muted-foreground w-7 justify-end">
                  {bar.stars}
                  <Star size={11} className="fill-amber-400 text-amber-400" />
                </span>
                <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-amber-400 transition-all duration-500"
                    style={{ width: `${bar.pct}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground w-8 text-right">
                  {bar.pct}%
                </span>
              </div>
            ))}
          </div>

          {/* Recent reviews */}
          <div className="space-y-3 pt-1">
            {store.recentReviews.map((review) => (
              <div
                key={review.id}
                className="rounded-xl border border-border-light p-3 space-y-1.5"
              >
                <div className="flex items-center gap-2">
                  <StarRating rating={review.rating} size="sm" />
                </div>
                <p className="text-sm text-foreground leading-snug line-clamp-2">
                  &ldquo;{review.comment}&rdquo;
                </p>
                <p className="text-xs text-muted-foreground">
                  — {review.author} · {review.date}
                </p>
              </div>
            ))}
          </div>

          {/* View all link */}
          <button className="flex items-center gap-1 text-sm font-medium text-primary transition-colors duration-200 hover:text-primary-dark group">
            Voir tous les avis
            <ChevronRight
              size={16}
              className="transition-transform duration-200 group-hover:translate-x-0.5"
            />
          </button>
        </div>
      </div>
    </div>
  );
}
