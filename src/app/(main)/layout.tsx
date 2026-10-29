import type { Metadata } from "next";
import { Suspense } from "react";
import { MarketplaceHeader, HeaderSkeleton } from "@/features/header";
import Footer from "@/components/Footer";
import AnnouncementBar from "@/components/AnnouncementBar";
import NewsletterAndTrust from "@/components/NewsletterAndTrust";
import { queryTrustBadges } from "@/features/home";
import { isComingSoon } from "@/lib/coming-soon";

export const metadata: Metadata = {};

/**
 * Main layout — wraps all public-facing pages with Header & Footer.
 * Auth pages (login/onboarding) use a separate layout without these.
 *
 * While coming soon, the editorial pages that stay open render WITHOUT the
 * marketplace chrome (header, footer, newsletter): it would only link into
 * the walled-off catalogue.
 *
 * The MarketplaceHeader is a Server Component that fetches categories
 * and popular searches with ISR caching, then passes data to the
 * interactive client shell. Suspense boundary ensures no LCP degradation.
 */
export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // ── Coming Soon bypass — skip marketplace chrome ──────────
  if (isComingSoon()) {
    return <>{children}</>;
  }

  // ── Normal marketplace layout ─────────────────────────────
  const trustBadges = await queryTrustBadges();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AnnouncementBar />
      <Suspense fallback={<HeaderSkeleton />}>
        <MarketplaceHeader />
      </Suspense>
      <main className="flex-1">{children}</main>
      <NewsletterAndTrust trustBadges={trustBadges} />
      <Footer />
    </div>
  );
}
