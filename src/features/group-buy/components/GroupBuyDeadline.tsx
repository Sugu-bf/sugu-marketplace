"use client";

import { useSecondClock } from "@/lib/hydration";
import { formatDeadline } from "../lib/group-buy-format";

/**
 * A deadline as a time of day ("14:30", "demain à 14:30"). The server draws
 * the time alone, in Ouagadougou's time zone; once hydrated the browser
 * redraws it in the device's own (Niamey or Cotonou are one hour ahead),
 * with the day when it is not today.
 */
export function GroupBuyDeadline({ at, offset = 0 }: { at: string | null | undefined; offset?: number }) {
  const now = useSecondClock();
  const text =
    now === null
      ? formatDeadline(at, { timeZone: "Africa/Ouagadougou", now: at ? Date.parse(at) : 0 })
      : formatDeadline(at, { now: now + offset });
  return <time dateTime={at ?? undefined}>{text ?? "…"}</time>;
}
