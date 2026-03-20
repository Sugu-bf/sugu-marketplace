"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import type { SocialProviderConfig } from "../mocks/auth";

interface SocialSignInButtonsProps {
  providers: SocialProviderConfig[];
  className?: string;
}

/**
 * Social sign-in buttons — désactivés jusqu'à implémentation OAuth backend.
 *
 * Le backend web (/api/v1/web-auth/) ne dispose pas encore d'endpoint OAuth.
 * L'OAuth Google est disponible uniquement pour le mobile (/api/v1/auth/google).
 *
 * Les boutons sont affichés avec un état "bientôt disponible" pour informer
 * l'utilisateur sans créer de frustration due à une action sans effet.
 */
function SocialSignInButtons({
  providers,
  className,
}: SocialSignInButtonsProps) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {providers.map((provider) => (
        <div key={provider.id} className="relative">
          <button
            type="button"
            disabled
            aria-label={`${provider.label} — bientôt disponible`}
            className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border-2 border-border bg-background text-sm font-medium text-muted-foreground opacity-50 cursor-not-allowed select-none"
          >
            <Image
              src={provider.iconPath}
              alt={`${provider.id} logo`}
              width={20}
              height={20}
              className="h-5 w-5 grayscale"
            />
            <span>{provider.label}</span>
          </button>
          {/* Badge "Bientôt" */}
          <span className="absolute -top-2 right-3 rounded-full bg-muted border border-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            Bientôt
          </span>
        </div>
      ))}
    </div>
  );
}

export { SocialSignInButtons };
