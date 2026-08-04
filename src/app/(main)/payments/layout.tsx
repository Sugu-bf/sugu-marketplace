import type { Metadata } from "next";

/**
 * The payment result pages are `"use client"`, so they cannot export metadata
 * themselves. Without this they inherited the root layout's `index, follow`,
 * which contradicted the `X-Robots-Tag: noindex` set for /payments/* in
 * next.config.ts. Conflicting directives resolve to the strictest one, but a
 * page should never ship two robots signals that disagree.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function PaymentsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
