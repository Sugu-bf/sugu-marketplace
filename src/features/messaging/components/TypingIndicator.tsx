"use client";

/**
 * TypingIndicator — shows "{name} est en train d'écrire..." with animated dots.
 */

interface TypingIndicatorProps {
  names: string[];
}

export function TypingIndicator({ names }: TypingIndicatorProps) {
  if (names.length === 0) return null;

  const label =
    names.length === 1
      ? `${names[0]} est en train d'écrire`
      : `${names.join(", ")} sont en train d'écrire`;

  return (
    <div className="flex items-center gap-2 px-4 py-2 text-xs text-muted-foreground animate-fade-slide-up">
      <div className="flex gap-0.5">
        <span
          className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce"
          style={{ animationDelay: "0ms" }}
        />
        <span
          className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce"
          style={{ animationDelay: "150ms" }}
        />
        <span
          className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce"
          style={{ animationDelay: "300ms" }}
        />
      </div>
      <span className="italic">{label}…</span>
    </div>
  );
}
