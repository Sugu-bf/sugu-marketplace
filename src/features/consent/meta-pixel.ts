"use client";

import { canTrackPage } from "@/components/analytics/pixel-privacy";
import { readConsent } from "./consent";

/**
 * Meta Pixel, loaded only after the visitor accepted measurement (audit M8).
 *
 * The loader is the standard fbevents.js bootstrap, run from this module
 * rather than an inline script (nothing for the CSP to allow inline). Meta's
 * automatic collection is switched off: no PageView of its own on history
 * changes (we send one per route) and no automatic button events, which could
 * read form contents.
 */

type Fbq = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[];
  push: Fbq;
  loaded: boolean;
  version: string;
  disablePushState?: boolean;
};

const PIXEL_SCRIPT = "https://connect.facebook.net/en_US/fbevents.js";

let initializedPixelId: string | null = null;
let revoked = false;

/**
 * Whether an event may leave from this address: never from a checkout,
 * payment, account, order, invoice or messaging page, nor with a query that
 * is not a campaign's (see pixel-privacy).
 */
export function isTrackedRoute(pathname: string, search = ""): boolean {
  return canTrackPage(pathname, search);
}

function pixelId(): string | null {
  const id = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  return id && /^\d+$/.test(id) ? id : null;
}

function installLoader(): void {
  const fbq = function (...args: unknown[]) {
    if (fbq.callMethod) fbq.callMethod(...args);
    else fbq.queue.push(args);
  } as Fbq;
  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = "2.0";
  fbq.queue = [];
  fbq.disablePushState = true;
  window.fbq = fbq;
  window._fbq = fbq;

  const script = document.createElement("script");
  script.async = true;
  script.src = PIXEL_SCRIPT;
  document.head.appendChild(script);
}

/** Loads and initializes the pixel once, if consent was given. */
function ensurePixel(): boolean {
  const id = pixelId();
  if (!id || readConsent() !== "granted") return false;
  if (initializedPixelId === id) {
    if (revoked) window.fbq("consent", "grant");
    revoked = false;
    return true;
  }

  if (!window.fbq) installLoader();
  window.fbq("set", "autoConfig", false, id);
  window.fbq("init", id);
  window.fbq("consent", "grant");
  initializedPixelId = id;
  return true;
}

/** Sends a standard event; a no-op without consent or pixel id. */
export function trackPixel(event: string, parameters?: Record<string, unknown>): void {
  if (!isTrackedRoute(window.location.pathname, window.location.search)) return;
  if (!ensurePixel()) return;
  if (parameters) window.fbq("track", event, parameters);
  else window.fbq("track", event);
}

/** Stops a pixel already loaded on this page from sending anything. */
export function revokePixel(): void {
  if (typeof window.fbq !== "function") return;
  window.fbq("consent", "revoke");
  revoked = true;
}

/** Test-only: forget the initialization. */
export function __resetMetaPixel(): void {
  initializedPixelId = null;
  revoked = false;
}
