import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind classes without conflicts.
 * Combines clsx (conditional classes) with tailwind-merge (dedup/override).
 *
 * @example
 * cn("px-4 py-2", isActive && "bg-primary text-white", className)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
