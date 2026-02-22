import { Inter } from "next/font/google";

/**
 * Primary font — Inter (loaded via next/font/google).
 * Variable `--font-inter` is consumed by the Tailwind theme.
 */
export const fontInter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});
