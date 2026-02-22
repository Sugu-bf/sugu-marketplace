"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
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

function calculateTimeLeft(target: string): TimeLeft {
  const diff = new Date(target).getTime() - Date.now();
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
 */
function CountdownTimer({ targetDate, className, label, onExpire }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => calculateTimeLeft(targetDate));

  useEffect(() => {
    const timer = setInterval(() => {
      const newTime = calculateTimeLeft(targetDate);
      setTimeLeft(newTime);
      if (newTime.expired) {
        clearInterval(timer);
        onExpire?.();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate, onExpire]);

  if (timeLeft.expired) {
    return (
      <div className={cn("flex items-center gap-1.5 text-sm text-error font-medium", className)}>
        <Clock size={14} />
        <span>Promo expirée</span>
      </div>
    );
  }

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {label && (
        <span className="text-sm text-muted-foreground flex items-center gap-1">
          <Clock size={14} className="text-error" />
          {label}
        </span>
      )}
      <div className="flex items-center gap-1">
        <TimeUnit value={timeLeft.days} label="j" />
        <span className="text-xs text-muted-foreground font-bold">:</span>
        <TimeUnit value={timeLeft.hours} label="h" />
        <span className="text-xs text-muted-foreground font-bold">:</span>
        <TimeUnit value={timeLeft.minutes} label="m" />
        <span className="text-xs text-muted-foreground font-bold">:</span>
        <TimeUnit value={timeLeft.seconds} label="s" />
      </div>
    </div>
  );
}

function TimeUnit({ value, label }: { value: number; label: string }) {
  return (
    <span className="inline-flex items-center gap-0.5 rounded-md bg-error/10 px-1.5 py-0.5 text-xs font-bold text-error tabular-nums">
      {String(value).padStart(2, "0")}
      <span className="text-[10px] font-medium text-error/70">{label}</span>
    </span>
  );
}

export { CountdownTimer };
