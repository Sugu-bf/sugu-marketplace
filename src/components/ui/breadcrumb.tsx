import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

/**
 * Reusable breadcrumb navigation component.
 * Server component — no interaction needed.
 */
function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav aria-label="Fil d'Ariane" className={cn("flex items-center", className)}>
      <ol className="flex items-center gap-1.5 text-sm">
        <li>
          <a
            href="/"
            className="flex items-center gap-1 text-muted-foreground transition-colors duration-200 hover:text-primary"
          >
            <Home size={14} />
            <span className="sr-only">Accueil</span>
          </a>
        </li>
        {items.map((item, idx) => (
          <li key={idx} className="flex items-center gap-1.5">
            <ChevronRight
              size={12}
              className="text-muted-foreground/50"
              aria-hidden="true"
            />
            {item.href ? (
              <a
                href={item.href}
                className="text-muted-foreground transition-colors duration-200 hover:text-primary"
              >
                {item.label}
              </a>
            ) : (
              <span className="font-medium text-foreground">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export { Breadcrumb };
