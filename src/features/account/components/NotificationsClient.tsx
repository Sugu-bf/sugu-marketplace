"use client";

import { useState, useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  Package,
  Tag,
  Bell,
  Truck,
  CheckCheck,
  CreditCard,
  XCircle,
  ShoppingBag,
  Loader2,
  ChevronRight,
  Sparkles,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui";
import {
  markNotificationRead,
  markAllNotificationsRead,
} from "@/features/account";
import type { NotificationData, NotificationGroup, Notification } from "@/features/account";
import { useRouter } from "next/navigation";
import Link from "next/link";

// ─── Type config ─────────────────────────────────────────────

const TYPE_CONFIG: Record<
  string,
  { icon: React.ReactNode; color: string; badgeBg: string }
> = {
  order_confirmed: {
    icon: <Package size={18} />,
    color: "bg-blue-50 text-blue-600 border-blue-200/60",
    badgeBg: "bg-blue-500",
  },
  order_shipped: {
    icon: <Truck size={18} />,
    color: "bg-amber-50 text-amber-600 border-amber-200/60",
    badgeBg: "bg-amber-500",
  },
  order_delivered: {
    icon: <Package size={18} />,
    color: "bg-emerald-50 text-emerald-600 border-emerald-200/60",
    badgeBg: "bg-emerald-500",
  },
  order_cancelled: {
    icon: <XCircle size={18} />,
    color: "bg-rose-50 text-rose-600 border-rose-200/60",
    badgeBg: "bg-rose-500",
  },
  order_status_changed: {
    icon: <Package size={18} />,
    color: "bg-teal-50 text-teal-600 border-teal-200/60",
    badgeBg: "bg-teal-500",
  },
  mixed_order_vendor_action_required: {
    icon: <Bell size={18} />,
    color: "bg-orange-50 text-orange-600 border-orange-200/60",
    badgeBg: "bg-orange-500",
  },
  payment_confirmed: {
    icon: <CreditCard size={18} />,
    color: "bg-emerald-50 text-emerald-600 border-emerald-200/60",
    badgeBg: "bg-emerald-500",
  },
  payment_failed: {
    icon: <CreditCard size={18} />,
    color: "bg-rose-50 text-rose-600 border-rose-200/60",
    badgeBg: "bg-rose-500",
  },
  new_order: {
    icon: <ShoppingBag size={18} />,
    color: "bg-blue-50 text-blue-600 border-blue-200/60",
    badgeBg: "bg-blue-500",
  },
  payment_received: {
    icon: <CreditCard size={18} />,
    color: "bg-emerald-50 text-emerald-600 border-emerald-200/60",
    badgeBg: "bg-emerald-500",
  },
  low_stock: {
    icon: <Tag size={18} />,
    color: "bg-amber-50 text-amber-600 border-amber-200/60",
    badgeBg: "bg-amber-500",
  },
  promo: {
    icon: <Sparkles size={18} />,
    color: "bg-purple-50 text-purple-600 border-purple-200/60",
    badgeBg: "bg-purple-500",
  },
  system: {
    icon: <Bell size={18} />,
    color: "bg-gray-100 text-gray-700 border-gray-200",
    badgeBg: "bg-gray-500",
  },
  delivery: {
    icon: <Truck size={18} />,
    color: "bg-orange-50 text-orange-600 border-orange-200/60",
    badgeBg: "bg-orange-500",
  },
};

const DEFAULT_TYPE_CONFIG = {
  icon: <Bell size={18} />,
  color: "bg-gray-100 text-gray-700 border-gray-200",
  badgeBg: "bg-gray-500",
};

/** Translate relative date string to clean French */
function formatNotifTime(timeStr: string): string {
  if (!timeStr) return "";
  const d = new Date(timeStr);
  if (!isNaN(d.getTime())) {
    return d.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return timeStr
    .replace(/(\d+)\s*weeks?\s*ago/i, "Il y a $1 sem.")
    .replace(/(\d+)\s*months?\s*ago/i, "Il y a $1 mois")
    .replace(/(\d+)\s*days?\s*ago/i, "Il y a $1 j")
    .replace(/(\d+)\s*hours?\s*ago/i, "Il y a $1 h")
    .replace(/(\d+)\s*minutes?\s*ago/i, "Il y a $1 min")
    .replace(/just now/i, "À l'instant")
    .replace(/yesterday/i, "Hier");
}

// ─── Props ───────────────────────────────────────────────────

interface NotificationsClientProps {
  initialData: NotificationData;
}

/**
 * Premium Notifications client component — elegant timeline & filter tabs.
 */
function NotificationsClient({ initialData }: NotificationsClientProps) {
  const router = useRouter();
  const [groups, setGroups] = useState<NotificationGroup[]>(initialData.groups);
  const [unreadCount, setUnreadCount] = useState(initialData.unreadCount);
  const [markingAll, setMarkingAll] = useState(false);
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "unread">("all");

  const handleMarkRead = useCallback(
    async (notifId: string) => {
      // Optimistic update
      setGroups((prev) =>
        prev.map((group) => ({
          ...group,
          items: group.items.map((item) =>
            item.id === notifId ? { ...item, isRead: true } : item
          ),
        }))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      setMarkingId(notifId);

      try {
        await markNotificationRead(notifId);
      } catch (err) {
        console.error("Mark read failed:", err);
        router.refresh();
      } finally {
        setMarkingId(null);
      }
    },
    [router]
  );

  const handleMarkAllRead = useCallback(async () => {
    setMarkingAll(true);

    // Optimistic update
    setGroups((prev) =>
      prev.map((group) => ({
        ...group,
        items: group.items.map((item) => ({ ...item, isRead: true })),
      }))
    );
    setUnreadCount(0);

    try {
      await markAllNotificationsRead();
    } catch (err) {
      console.error("Mark all read failed:", err);
      router.refresh();
    } finally {
      setMarkingAll(false);
    }
  }, [router]);

  // Filter groups according to activeTab
  const filteredGroups = useMemo(() => {
    if (activeTab === "all") return groups;
    return groups
      .map((g) => ({
        ...g,
        items: g.items.filter((item) => !item.isRead),
      }))
      .filter((g) => g.items.length > 0);
  }, [groups, activeTab]);

  const totalNotifs = useMemo(
    () => groups.reduce((acc, g) => acc + g.items.length, 0),
    [groups]
  );

  return (
    <div className="space-y-6">
      {/* Top Bar Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Notifications
            </h1>
            {unreadCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/10 px-3 py-1 text-xs font-bold text-orange-600 ring-1 ring-inset ring-orange-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse" />
                {unreadCount} non lue{unreadCount > 1 ? "s" : ""}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Suivez l&apos;état de vos commandes et alertes en temps réel.
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            disabled={markingAll}
            className="rounded-xl border-border/80 bg-white hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 shadow-sm transition-all text-xs font-semibold"
          >
            {markingAll ? (
              <>
                <Loader2 size={14} className="animate-spin mr-1.5" />
                Patientez...
              </>
            ) : (
              <>
                <CheckCheck size={15} className="mr-1.5 text-orange-500" />
                Tout marquer comme lu
              </>
            )}
          </Button>
        )}
      </div>

      {/* Filter Tabs */}
      {totalNotifs > 0 && (
        <div className="flex items-center gap-2 border-b border-border/40 pb-3">
          <button
            onClick={() => setActiveTab("all")}
            className={cn(
              "px-4 py-2 text-xs font-semibold rounded-xl transition-all duration-200",
              activeTab === "all"
                ? "bg-foreground text-background shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-gray-100/80"
            )}
          >
            Toutes ({totalNotifs})
          </button>
          <button
            onClick={() => setActiveTab("unread")}
            className={cn(
              "px-4 py-2 text-xs font-semibold rounded-xl transition-all duration-200 flex items-center gap-1.5",
              activeTab === "unread"
                ? "bg-orange-500 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-gray-100/80"
            )}
          >
            Non lues ({unreadCount})
          </button>
        </div>
      )}

      {/* Notification list */}
      {filteredGroups.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border/80 bg-white/70 p-10 lg:p-16 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50 text-orange-500 mb-4 ring-8 ring-orange-50/50">
            <Bell size={28} />
          </div>
          <h3 className="text-base font-bold text-foreground lg:text-lg">
            {activeTab === "unread"
              ? "Aucune notification non lue"
              : "Aucune notification"}
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto mt-1.5 leading-relaxed">
            {activeTab === "unread"
              ? "Vous avez consulté toutes vos alertes. Beau travail !"
              : "Vous recevrez ici les mises à jour en temps réel sur vos commandes."}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {filteredGroups.map((group) => (
            <div key={group.label} className="space-y-3">
              {/* Group Date Header */}
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 rounded-lg bg-gray-100 px-2.5 py-1 text-[11px] font-bold text-gray-600 uppercase tracking-wider">
                  <Calendar size={12} className="text-gray-400" />
                  {group.label}
                </span>
                <div className="h-px flex-1 bg-border/40" />
              </div>

              {/* Group items */}
              <div className="space-y-2.5">
                {group.items.map((notif) => {
                  const config =
                    TYPE_CONFIG[notif.type] ?? DEFAULT_TYPE_CONFIG;

                  const notifCard = (
                    <div
                      key={notif.id}
                      onClick={() => {
                        if (!notif.isRead) handleMarkRead(notif.id);
                      }}
                      className={cn(
                        "group relative flex items-start gap-4 rounded-2xl border p-4 sm:p-4.5 transition-all duration-200 cursor-pointer overflow-hidden",
                        notif.isRead
                          ? "border-border/60 bg-white/90 shadow-sm hover:border-gray-300 hover:shadow-md"
                          : "border-orange-200/80 bg-white shadow-md ring-1 ring-orange-500/10 border-l-4 border-l-orange-500 hover:shadow-lg"
                      )}
                    >
                      {/* Icon container */}
                      <div
                        className={cn(
                          "flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border shadow-xs transition-transform duration-200 group-hover:scale-105",
                          config.color
                        )}
                      >
                        {markingId === notif.id ? (
                          <Loader2 size={18} className="animate-spin" />
                        ) : (
                          config.icon
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="flex items-baseline justify-between gap-2">
                          <p
                            className={cn(
                              "text-sm leading-snug",
                              notif.isRead
                                ? "font-semibold text-gray-800"
                                : "font-bold text-foreground"
                            )}
                          >
                            {notif.title}
                          </p>
                          <span className="text-[11px] font-medium text-muted-foreground flex-shrink-0">
                            {formatNotifTime(notif.createdAt)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">
                          {notif.message}
                        </p>
                      </div>

                      {/* Action Chevron & Unread Dot */}
                      <div className="flex items-center gap-2 flex-shrink-0 self-center">
                        {!notif.isRead && (
                          <span className="h-2.5 w-2.5 rounded-full bg-orange-500 ring-4 ring-orange-100 animate-pulse" />
                        )}
                        {notif.actionUrl && (
                          <ChevronRight
                            size={16}
                            className="text-gray-400 transition-transform group-hover:translate-x-1 group-hover:text-orange-500"
                          />
                        )}
                      </div>
                    </div>
                  );

                  return notif.actionUrl ? (
                    <Link key={notif.id} href={notif.actionUrl} className="block">
                      {notifCard}
                    </Link>
                  ) : (
                    notifCard
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export { NotificationsClient };
