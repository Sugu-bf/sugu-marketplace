import { Quicksand } from "next/font/google";

/**
 * Primary font — Quicksand (loaded via next/font/google).
 * Variable `--font-quicksand` is consumed by the Tailwind theme.
 */
export const fontQuicksand = Quicksand({
  variable: "--font-quicksand",
  weight: ["500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
});
