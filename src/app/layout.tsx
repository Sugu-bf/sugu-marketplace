import type { Metadata, Viewport } from "next";
import { fontQuicksand } from "@/lib/fonts";
import { META_PIXEL_ID, SEO, SITE_NAME, SITE_URL } from "@/lib/constants";
import { fetchBranding } from "@/lib/branding.service";
import { BrandingProvider } from "@/components/BrandingProvider";
import BrandingHead from "@/components/BrandingHead";
import { ToastContainer } from "@/features/toast/ToastContainer";
import { QueryProvider } from "@/lib/query-provider";
import { WishlistProvider } from "@/features/wishlist/components/WishlistProvider";
import { TokenRefreshProvider } from "@/components/TokenRefreshProvider";
import { ConsentBanner } from "@/features/consent/components/ConsentBanner";
import { MetaPixelPageViews } from "@/features/consent/components/MetaPixelPageViews";
import { organizationJsonLd, safeJsonLd, webSiteJsonLd } from "@/lib/seo/structured-data";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SEO.defaultTitle,
    template: SEO.titleTemplate,
  },
  description: SEO.defaultDescription,
  openGraph: {
    type: "website",
    locale: SEO.locale,
    siteName: SITE_NAME,
    title: SEO.defaultTitle,
    description: SEO.defaultDescription,
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    creator: SEO.twitterHandle,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#F15412",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Fetch branding data at the server level (ISR cached)
  const branding = await fetchBranding();

  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${fontQuicksand.variable} font-sans antialiased`} suppressHydrationWarning>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: safeJsonLd({
              "@context": "https://schema.org",
              "@graph": [organizationJsonLd(), webSiteJsonLd()],
            }),
          }}
        />
        <BrandingProvider branding={branding}>
          <QueryProvider>
            <WishlistProvider>
              <TokenRefreshProvider>
                <BrandingHead />
                {children}
                <ToastContainer />
                {/* Measurement only exists with a pixel, and only after consent. */}
                {META_PIXEL_ID && (
                  <>
                    <MetaPixelPageViews />
                    <ConsentBanner />
                  </>
                )}
              </TokenRefreshProvider>
            </WishlistProvider>
          </QueryProvider>
        </BrandingProvider>
      </body>
    </html>
  );
}
