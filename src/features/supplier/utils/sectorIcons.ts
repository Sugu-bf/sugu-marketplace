import {
  Monitor,
  Shirt,
  UtensilsCrossed,
  Leaf,
  SprayCan,
  Home,
  Factory,
  BookOpen,
  Bath,
  Cross,
  Tag,
  type LucideIcon,
} from "lucide-react";

/**
 * Maps Lucide icon name strings to their component references.
 * Used to render dynamic sector icons from data (mocks / API).
 */
const iconMap: Record<string, LucideIcon> = {
  Monitor,
  Shirt,
  UtensilsCrossed,
  Leaf,
  SprayCan,
  Home,
  Factory,
  BookOpen,
  Bath,
  Cross,
};

/**
 * Resolve a Lucide icon name string to a component.
 * Falls back to `Tag` icon if the name is unknown.
 */
export function getSectorIcon(name?: string): LucideIcon {
  if (!name) return Tag;
  return iconMap[name] ?? Tag;
}
