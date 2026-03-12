"use client";

import { useState, useCallback } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui";
import {
  markNotificationRead,
  markAllNotificationsRead,
} from "@/features/account";
import type { NotificationData, NotificationGroup } from "@/features/account";
import { useRouter } from "next/navigation";
import Link from "next/link";

// ─── Type config ─────────────────────────────────────────────

const TYPE_CONFIG: Record<string, { icon: React.ReactNode; color: string }> = {
  order_confirmed: { icon: <Package size={16} />, color: "bg-blue-50 text-blue-600" },
  order_shipped: { icon: <Truck size={16} />, color: "bg-primary-50 text-primary" },
  order_delivered: { icon: <Package size={16} />, color: "bg-green-50 text-green-600" },
  order_cancelled: { icon: <XCircle size={16} />, color: "bg-red-50 text-red-600" },
  payment_confirmed: { icon: <CreditCard size={16} />, color: "bg-green-50 text-green-600" },
  payment_failed: { icon: <CreditCard size={16} />, color: "bg-red-50 text-red-600" },
  new_order: { icon: <ShoppingBag size={16} />, color: "bg-blue-50 text-blue-600" },
  payment_received: { icon: <CreditCard size={16} />, color: "bg-green-50 text-green-600" },
  low_stock: { icon: <Tag size={16} />, color: "bg-accent-50 text-accent-dark" },
  promo: { icon: <Tag size={16} />, color: "bg-accent-50 text-accent-dark" },
  system: { icon: <Bell size={16} />, color: "bg-muted text-muted-foreground" },
  delivery: { icon: <Truck size={16} />, color: "bg-primary-50 text-primary" },
};

const DEFAULT_TYPE_CONFIG = { icon: <Bell size={16} />, color: "bg-muted text-muted-foreground" };

// ─── Props ───────────────────────────────────────────────────

interface NotificationsClientProps {
  initialData: NotificationData;
}

/**
 * Notifications client component — mark read/all-read interactivity.
 */
function NotificationsClient({ initialData }: NotificationsClientProps) {
  const router = useRouter();
  const [groups, setGroups] = useState<NotificationGroup[]>(initialData.groups);
  const [unreadCount, setUnreadCount] = useState(initialData.unreadCount);
  const [markingAll, setMarkingAll] = useState(false);
  const [markingId, setMarkingId] = useState<string | null>(null);

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
        // Revert on failure
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

  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            Notifications
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {unreadCount} non lue{unreadCount > 1 ? "s" : ""}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            disabled={markingAll}
          >
            {markingAll ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Marquage...
              </>
            ) : (
              <>
                <CheckCheck size={14} /> Tout marquer comme lu
              </>
            )}
          </Button>
        )}
      </div>

      {/* Notification list */}
      {groups.length === 0 ? (
        <div className="rounded-2xl border border-border-light bg-background p-8 lg:p-12 text-center">
          <Bell size={48} className="text-muted-foreground mx-auto mb-4" />
          <p className="text-base font-semibold text-foreground lg:text-lg">
            Aucune notification
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Vous n&apos;avez aucune notification pour le moment.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <div key={group.label}>
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                {group.label}
              </h2>
              <div className="space-y-2">
                {group.items.map((notif) => {
                  const config =
                    TYPE_CONFIG[notif.type] ?? DEFAULT_TYPE_CONFIG;

                  const notifCard = (
                    <div
                      key={notif.id}
                      className={cn(
                        "flex items-start gap-3 rounded-2xl border p-4 transition-all hover:shadow-sm cursor-pointer",
                        notif.isRead
                          ? "border-border-light bg-background"
                          : "border-primary/20 bg-primary-50/30"
                      )}
                      onClick={() => {
                        if (!notif.isRead) handleMarkRead(notif.id);
                      }}
                    >
                      <div
                        className={cn(
                          "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg",
                          config.color
                        )}
                      >
                        {markingId === notif.id ? (
                          <Loader2
                            size={16}
                            className="animate-spin text-current"
                          />
                        ) : (
                          config.icon
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className={cn(
                              "text-sm",
                              notif.isRead
                                ? "font-medium text-foreground"
                                : "font-bold text-foreground"
                            )}
                          >
                            {notif.title}
                          </p>
                          <span className="text-xs text-muted-foreground flex-shrink-0 mt-0.5">
                            {new Date(notif.createdAt).toLocaleTimeString(
                              "fr-FR",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {notif.message}
                        </p>
                      </div>
                      {!notif.isRead && (
                        <div className="h-2 w-2 flex-shrink-0 rounded-full bg-primary mt-2" />
                      )}
                    </div>
                  );

                  return notif.actionUrl ? (
                    <Link key={notif.id} href={notif.actionUrl}>
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
    </>
  );
}

export { NotificationsClient };
