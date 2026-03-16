"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  User,
  Package,
  ShoppingCart,
  MapPin,
  Bell,
  Gift,
  MessageSquare,
  Settings,
  HelpCircle,
  LogOut,
  CheckCircle2,
} from "lucide-react";
import { logout } from "@/lib/api/auth";
import type { UserProfile } from "@/features/account";

// ─── Navigation items ────────────────────────────────────────

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  variant?: "default" | "danger";
  onClick?: () => void;
}

const MAIN_NAV: NavItem[] = [
  { label: "Détails du compte", href: "/account", icon: <User size={18} /> },
  { label: "Mes commandes", href: "/account/orders", icon: <Package size={18} /> },
  { label: "Mon panier", href: "/cart", icon: <ShoppingCart size={18} /> },
  { label: "Mes adresses", href: "/account/addresses", icon: <MapPin size={18} /> },
  { label: "Notifications", href: "/account/notifications", icon: <Bell size={18} /> },
  { label: "Messages", href: "/messages", icon: <MessageSquare size={18} /> },
  { label: "Parrainer un ami", href: "/account/referral", icon: <Gift size={18} /> },
];

// ─── Props ───────────────────────────────────────────────────

interface AccountSidebarProps {
  profile: UserProfile;
  className?: string;
}

/**
 * Account sidebar — user avatar, navigation, and logout.
 * Client component — uses usePathname for active state highlighting.
 * Shared across all /account/* pages.
 */
function AccountSidebar({ profile, className }: AccountSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  // Extract initials from the single `name` field
  const nameParts = (profile.name ?? "").trim().split(/\s+/);
  const initials =
    nameParts.length >= 2
      ? `${nameParts[0].charAt(0)}${nameParts[nameParts.length - 1].charAt(0)}`
      : (nameParts[0]?.charAt(0) ?? "?");

  const isActive = (href: string) => {
    if (href === "/account") return pathname === "/account";
    return pathname.startsWith(href);
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/login");
    } catch {
      // Even if logout fails, redirect to login
      router.push("/login");
    }
  };

  const SECONDARY_NAV: NavItem[] = [
    { label: "Paramètres du compte", href: "/account/settings", icon: <Settings size={18} /> },
    { label: "Centre d'aide", href: "/help", icon: <HelpCircle size={18} /> },
  ];

  return (
    <aside
      className={cn(
        "rounded-2xl border border-border-light bg-background shadow-sm overflow-hidden",
        className
      )}
    >
      {/* User profile header */}
      <div className="p-5 border-b border-border-light">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-primary text-white text-xl font-bold">
            {initials.toUpperCase()}
          </div>

          {/* Name + email */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground truncate">
              {profile.name}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {profile.email}
            </p>
            {profile.emailVerified && (
              <div className="flex items-center gap-1 mt-1">
                <CheckCircle2 size={12} className="text-success" />
                <span className="text-[10px] font-semibold text-success">
                  Vérifié
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main navigation */}
      <nav className="p-2" aria-label="Menu du compte">
        <ul className="space-y-0.5">
          {MAIN_NAV.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  "hover:bg-primary-50 hover:text-primary",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
                  isActive(item.href)
                    ? "bg-primary-50 text-primary border-l-[3px] border-primary font-semibold"
                    : "text-muted-foreground"
                )}
                aria-current={isActive(item.href) ? "page" : undefined}
              >
                <span className={cn(
                  "flex-shrink-0",
                  isActive(item.href) ? "text-primary" : "text-muted-foreground"
                )}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Separator */}
        <div className="my-2 mx-3 border-t border-border-light" />

        {/* Secondary nav */}
        <ul className="space-y-0.5">
          {SECONDARY_NAV.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  "hover:bg-primary-50 hover:text-primary",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
                  isActive(item.href)
                    ? "bg-primary-50 text-primary border-l-[3px] border-primary font-semibold"
                    : "text-muted-foreground"
                )}
                aria-current={isActive(item.href) ? "page" : undefined}
              >
                <span className={cn(
                  "flex-shrink-0",
                  isActive(item.href) ? "text-primary" : "text-muted-foreground"
                )}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            </li>
          ))}
          {/* Logout button */}
          <li>
            <button
              onClick={handleLogout}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                "text-error hover:bg-error/5 hover:text-error",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
              )}
            >
              <span className="flex-shrink-0 text-error">
                <LogOut size={18} />
              </span>
              Se déconnecter
            </button>
          </li>
        </ul>
      </nav>
    </aside>
  );
}

export { AccountSidebar };
