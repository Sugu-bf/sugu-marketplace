"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

/**
 * Reusable pagination component with numbered pages, prev/next, and ellipsis.
 * Client component — requires onClick interaction.
 */
function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const getVisiblePages = (): (number | "ellipsis")[] => {
    const pages: (number | "ellipsis")[] = [];
    const delta = 1;

    pages.push(1);

    const rangeStart = Math.max(2, currentPage - delta);
    const rangeEnd = Math.min(totalPages - 1, currentPage + delta);

    if (rangeStart > 2) pages.push("ellipsis");

    for (let i = rangeStart; i <= rangeEnd; i++) {
      pages.push(i);
    }

    if (rangeEnd < totalPages - 1) pages.push("ellipsis");

    if (totalPages > 1) pages.push(totalPages);

    return pages;
  };

  const visiblePages = getVisiblePages();

  return (
    <nav
      aria-label="Pagination"
      className={cn("flex items-center justify-center gap-1.5", className)}
    >
      {/* Previous */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Page précédente"
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-all duration-200",
          "hover:border-primary/40 hover:bg-primary-50 hover:text-primary",
          "disabled:pointer-events-none disabled:opacity-40"
        )}
      >
        <ChevronLeft size={16} />
      </button>

      {/* Pages */}
      {visiblePages.map((page, idx) =>
        page === "ellipsis" ? (
          <span
            key={`ellipsis-${idx}`}
            className="flex h-9 w-9 items-center justify-center text-sm text-muted-foreground"
            aria-hidden="true"
          >
            …
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            aria-label={`Page ${page}`}
            aria-current={currentPage === page ? "page" : undefined}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition-all duration-200",
              currentPage === page
                ? "bg-primary text-white shadow-sm"
                : "border border-border text-foreground hover:border-primary/40 hover:bg-primary-50 hover:text-primary"
            )}
          >
            {page}
          </button>
        )
      )}

      {/* Next */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Page suivante"
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-all duration-200",
          "hover:border-primary/40 hover:bg-primary-50 hover:text-primary",
          "disabled:pointer-events-none disabled:opacity-40"
        )}
      >
        <ChevronRight size={16} />
      </button>
    </nav>
  );
}

export { Pagination };
