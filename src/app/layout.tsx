import type { Metadata, Viewport } from "next";
import { fontInter } from "@/lib/fonts";
import { SEO, SITE_NAME, SITE_URL } from "@/lib/constants";
import { fetchBranding } from "@/lib/branding.service";
import { BrandingProvider } from "@/components/BrandingProvider";
import BrandingHead from "@/components/BrandingHead";
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
      <body className={`${fontInter.variable} font-sans antialiased`}>
        <BrandingProvider branding={branding}>
          <BrandingHead />
          {children}
        </BrandingProvider>
      </body>
    </html>
  );
}
