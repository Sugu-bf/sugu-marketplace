"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ViewAllButtonProps {
  label?: string;
  count?: number;
  href?: string;
  onClick?: () => void;
  className?: string;
}

/**
 * "View All" pill button used in section headers.
 * Renders as a link or button depending on presence of href/onClick.
 */
function ViewAllButton({
  label = "Voir tout",
  count,
  href = "/search",
  onClick,
  className,
}: ViewAllButtonProps) {
  const content = (
    <>
      {label}
      {count !== undefined && ` (+${count})`}
      <ArrowRight
        size={14}
        className="transition-transform duration-300 group-hover/vab:translate-x-1"
      />
    </>
  );

  const classes = cn(
    "group/vab flex items-center gap-2 rounded-full border-2 border-border px-4 py-2 text-sm font-semibold text-foreground",
    "transition-all duration-300 hover:border-primary/40 hover:bg-primary-50 hover:text-primary",
    className
  );

  if (onClick && !href) {
    return (
      <button type="button" onClick={onClick} className={classes}>
        {content}
      </button>
    );
  }

  return (
    <Link href={href} className={classes} onClick={onClick}>
      {content}
    </Link>
  );
}

export { ViewAllButton };
