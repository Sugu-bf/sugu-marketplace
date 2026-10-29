/**
 * Global type augmentations for third-party browser globals.
 * This file is included automatically by TypeScript via tsconfig paths.
 */

// ─── Facebook / Meta Pixel ────────────────────────────────────

declare global {
  interface Window {
    /**
     * Facebook Pixel / Meta Pixel function.
     * Installed by @/features/consent/meta-pixel, only after consent.
     */
    fbq: (...args: unknown[]) => void;
    _fbq?: (...args: unknown[]) => void;
  }
}

export {};
