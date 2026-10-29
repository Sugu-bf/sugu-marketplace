"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { useSecondClock } from "@/lib/hydration";
import { Clock } from "lucide-react";

interface CountdownTimerProps {
  targetDate: string; // ISO date string
  className?: string;
  label?: string;
  onExpire?: () => void;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
}

export function calculateTimeLeft(target: string, now: number): TimeLeft {
  const diff = new Date(target).getTime() - now;
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  }
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    expired: false,
  };
}

/**
 * Countdown timer component — Client component.
 * Displays remaining time until a target date.
 *
 * The time comes from the shared clock: none on the server render (a page
 * cached by ISR would show the time it was rendered at, and hydrate with
 * another), so the units show "--" until the browser takes over.
 */
function CountdownTimer({ targetDate, className, label, onExpire }: CountdownTimerProps) {
  const now = useSecondClock();
  const timeLeft = now === null ? null : calculateTimeLeft(targetDate, now);
  const expired = timeLeft?.expired ?? false;

  useEffect(() => {
    if (expired) onExpire?.();
  }, [expired, onExpire]);

  if (expired) {
    return (
      <div className={cn("flex items-center gap-1.5 text-sm text-error font-medium", className)}>
        <Clock size={14} />
        <span>Promo expirée</span>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {label && (
        <span className="text-sm text-muted-foreground flex items-center gap-1">
          <Clock size={14} className="text-error" />
          {label}
        </span>
      )}
      <div className="flex items-center gap-1">
        <TimeUnit value={timeLeft?.days ?? null} label="j" />
        <span className="text-xs text-muted-foreground font-bold">:</span>
        <TimeUnit value={timeLeft?.hours ?? null} label="h" />
        <span className="text-xs text-muted-foreground font-bold">:</span>
        <TimeUnit value={timeLeft?.minutes ?? null} label="m" />
        <span className="text-xs text-muted-foreground font-bold">:</span>
        <TimeUnit value={timeLeft?.seconds ?? null} label="s" />
      </div>
    </div>
  );
}

function TimeUnit({ value, label }: { value: number | null; label: string }) {
  return (
    <span className="inline-flex items-center gap-0.5 rounded-md bg-error/10 px-1.5 py-0.5 text-xs font-bold text-error tabular-nums">
      {value === null ? "--" : String(value).padStart(2, "0")}
      <span className="text-[10px] font-medium text-error/70">{label}</span>
    </span>
  );
}

export { CountdownTimer };
