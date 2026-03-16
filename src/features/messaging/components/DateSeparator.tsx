"use client";

/**
 * DateSeparator — centered pill showing "Aujourd'hui", "Hier", or a formatted date.
 */

interface DateSeparatorProps {
  date: string; // ISO date string
}

function formatDateLabel(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const msgDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.floor(
    (today.getTime() - msgDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return "Hier";

  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year:
      date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

export function DateSeparator({ date }: DateSeparatorProps) {
  return (
    <div className="flex items-center justify-center py-3">
      <span className="bg-muted text-muted-foreground text-xs px-3 py-1 rounded-full font-medium">
        {formatDateLabel(date)}
      </span>
    </div>
  );
}
