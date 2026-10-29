"use client";

import { useSyncExternalStore } from "react";

/**
 * The visitor's choice about audience measurement (Meta Pixel), kept in this
 * browser (audit M8). Until a choice is made, nothing is measured.
 */
export type ConsentChoice = "granted" | "denied";
export type ConsentState = ConsentChoice | "unset";

const STORAGE_KEY = "sugu_consent_v1";
const CHANGE_EVENT = "sugu:consent-changed";

export function readConsent(): ConsentState {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === "granted" || value === "denied" ? value : "unset";
  } catch {
    return "unset";
  }
}

/** Records a choice, or forgets it (null) so the banner asks again. */
export function writeConsent(choice: ConsentChoice | null): void {
  try {
    if (choice) localStorage.setItem(STORAGE_KEY, choice);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage blocked: the choice holds for this page only, nothing is stored.
  }
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

function subscribe(onChange: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) onChange();
  };
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
}

/** The current choice; "unset" during server rendering and hydration. */
export function useConsent(): ConsentState {
  return useSyncExternalStore(subscribe, readConsent, () => "unset");
}
