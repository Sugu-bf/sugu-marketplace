import {
  Monitor,
  Headphones,
  Shirt,
  ShoppingBag,
  UtensilsCrossed,
  Leaf,
  Laptop,
  Printer,
  SprayCan,
  Sparkles,
  Cherry,
  TreePine,
  Dumbbell,
  HeartPulse,
  BookOpen,
  Pen,
  Scissors,
  Stethoscope,
  Home,
  Armchair,
  Smartphone,
  Plug,
  Tag,
  type LucideIcon,
} from "lucide-react";

/**
 * Maps Lucide icon name strings to their component references.
 * Used to render dynamic icons from data (mocks / API).
 */
const iconMap: Record<string, LucideIcon> = {
  Monitor,
  Headphones,
  Shirt,
  ShoppingBag,
  UtensilsCrossed,
  Leaf,
  Laptop,
  Printer,
  SprayCan,
  Sparkles,
  Cherry,
  TreePine,
  Dumbbell,
  HeartPulse,
  BookOpen,
  Pen,
  Scissors,
  Stethoscope,
  Home,
  Armchair,
  Smartphone,
  Plug,
};

/**
 * Resolve a Lucide icon name string to a component.
 * Falls back to `Tag` icon if the name is unknown.
 */
export function getCategoryIcon(name?: string): LucideIcon {
  if (!name) return Tag;
  return iconMap[name] ?? Tag;
}
