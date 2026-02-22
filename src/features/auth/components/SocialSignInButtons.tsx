import Image from "next/image";
import { cn } from "@/lib/utils";
import type { SocialProviderConfig } from "../mocks/auth";

interface SocialSignInButtonsProps {
  providers: SocialProviderConfig[];
  className?: string;
}

/**
 * Social sign-in buttons — Server Component (no interaction beyond link).
 * Renders outlined buttons with provider icons and labels.
 */
function SocialSignInButtons({
  providers,
  className,
}: SocialSignInButtonsProps) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {providers.map((provider) => (
        <button
          key={provider.id}
          type="button"
          className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border-2 border-border bg-background text-sm font-medium text-foreground transition-all duration-200 hover:border-muted-foreground/40 hover:bg-muted active:scale-[0.98]"
          aria-label={provider.label}
        >
          <Image
            src={provider.iconPath}
            alt={`${provider.id} logo`}
            width={20}
            height={20}
            className="h-5 w-5"
          />
          <span>{provider.label}</span>
        </button>
      ))}
    </div>
  );
}

export { SocialSignInButtons };
