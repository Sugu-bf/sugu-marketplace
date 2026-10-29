"use client";

import { useId } from "react";
import Link from "next/link";
import { useConsent, writeConsent } from "../consent";
import { revokePixel } from "../meta-pixel";

/**
 * Asks once whether the visitor accepts audience measurement (Meta Pixel).
 * Accepting and refusing are equally easy; nothing is measured until the
 * visitor accepts. Not modal: the page stays usable while it is shown.
 */
export function ConsentBanner() {
  const consent = useConsent();
  const titleId = useId();
  const textId = useId();

  if (consent !== "unset") return null;

  return (
    <section
      role="region"
      aria-labelledby={titleId}
      aria-describedby={textId}
      className="fixed inset-x-0 bottom-0 z-[60] border-t border-border bg-white p-4 shadow-lg sm:inset-x-4 sm:bottom-4 sm:mx-auto sm:max-w-2xl sm:rounded-2xl sm:border"
    >
      <h2 id={titleId} className="text-sm font-bold text-foreground">
        Mesure d&apos;audience
      </h2>
      <p id={textId} className="mt-1 text-sm text-muted-foreground">
        Avec votre accord, Sugu utilise le pixel de Meta pour mesurer l&apos;efficacité de
        ses publicités. Rien n&apos;est mesuré si vous refusez, et vous pouvez changer
        d&apos;avis à tout moment depuis le bas de page.{" "}
        <Link href="/politique-de-confidentialite" className="font-semibold text-primary underline">
          En savoir plus
        </Link>
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            writeConsent("denied");
            revokePixel();
          }}
          className="flex-1 rounded-full border-2 border-border px-5 py-2 text-sm font-semibold text-foreground hover:border-primary/40"
        >
          Refuser
        </button>
        <button
          type="button"
          onClick={() => writeConsent("granted")}
          className="flex-1 rounded-full border-2 border-primary bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-primary-dark"
        >
          Accepter
        </button>
      </div>
    </section>
  );
}

/** Reopens the banner: the footer's way to change one's mind. */
export function ConsentPreferencesButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => {
        revokePixel();
        writeConsent(null);
      }}
      className={className}
    >
      Gérer la mesure d&apos;audience
    </button>
  );
}
