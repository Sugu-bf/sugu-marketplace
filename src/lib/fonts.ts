import localFont from "next/font/local";

/**
 * Primary font — Quicksand, served by the site itself.
 * Variable `--font-quicksand` is consumed by the Tailwind theme.
 *
 * Not through next/font/google: the build then asks Google for the files,
 * and Google may answer `/l/font?kit=…&skey=…` addresses that Turbopack
 * (Next 16.1) cannot read ("next/font/google queries have exactly one
 * entry"), which fails the whole build. The file is Google's latin subset,
 * variable from 500 to 700 (SIL Open Font License).
 */
export const fontQuicksand = localFont({
  src: "./fonts-files/quicksand-latin-500-700.woff2",
  variable: "--font-quicksand",
  weight: "500 700",
  style: "normal",
  display: "swap",
});
