"use client";

import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSecondClock } from "@/lib/hydration";
import { formatRemaining } from "../lib/group-buy-format";

interface GroupBuyCountdownProps {
  /** ISO date the countdown runs to. */
  target: string | null;
  /** Server time minus device time (see clockOffsetFrom). */
  offset?: number;
  prefix?: string;
  suffix?: string;
  expiredLabel?: string;
  className?: string;
  /** Shown in red under this many milliseconds. */
  urgentUnderMs?: number;
}

/**
 * A countdown on the server's clock: a phone set to the wrong time still
 * shows the right remaining time. Renders a placeholder until hydrated, so
 * the server and the browser draw the same first frame.
 */
export function GroupBuyCountdown({
  target,
  offset = 0,
  prefix,
  suffix,
  expiredLabel = "Clôture en cours",
  className,
  urgentUnderMs = 3_600_000,
}: GroupBuyCountdownProps) {
  const now = useSecondClock();
  const end = target ? Date.parse(target) : Number.NaN;
  const remaining = now === null || !Number.isFinite(end) ? null : end - (now + offset);
  const left = remaining === null ? "…" : formatRemaining(remaining);
  const urgent = remaining !== null && remaining > 0 && remaining < urgentUnderMs;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap font-medium tabular-nums",
        urgent ? "text-error" : "text-foreground/80",
        className,
      )}
    >
      <Clock size={14} aria-hidden="true" className="flex-shrink-0" />
      {left === null ? (
        <span>{expiredLabel}</span>
      ) : (
        <>
          {prefix && <span className="font-normal">{prefix}</span>}
          <span>{left}</span>
          {suffix && <span className="font-normal">{suffix}</span>}
        </>
      )}
    </span>
  );
}
