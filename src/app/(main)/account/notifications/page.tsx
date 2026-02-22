import { createMetadata } from "@/lib/metadata";
import { Breadcrumb, Button } from "@/components/ui";
import { queryNotifications } from "@/features/account";
import { cn } from "@/lib/utils";
import { Package, Tag, Bell, Truck, CheckCheck } from "lucide-react";

export const metadata = createMetadata({ title: "Notifications", description: "Consultez vos notifications sur Sugu.", path: "/account/notifications", noIndex: true });

const TYPE_CONFIG: Record<string, { icon: React.ReactNode; color: string }> = {
  order: { icon: <Package size={16} />, color: "bg-blue-50 text-blue-600" },
  promo: { icon: <Tag size={16} />, color: "bg-accent-50 text-accent-dark" },
  system: { icon: <Bell size={16} />, color: "bg-muted text-muted-foreground" },
  delivery: { icon: <Truck size={16} />, color: "bg-primary-50 text-primary" },
};

export default async function NotificationsPage() {
  const notifications = await queryNotifications();
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <Breadcrumb items={[{ label: "Mon compte", href: "/account" }, { label: "Notifications" }]} />
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl mt-3">Notifications</h1>
          <p className="text-sm text-muted-foreground mt-1">{unreadCount} non lue{unreadCount > 1 ? "s" : ""}</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm"><CheckCheck size={14} /> Tout marquer comme lu</Button>
        )}
      </div>

      <div className="space-y-2">
        {notifications.map((notif) => {
          const config = TYPE_CONFIG[notif.type] ?? TYPE_CONFIG.system;
          return (
            <div
              key={notif.id}
              className={cn(
                "flex items-start gap-3 rounded-2xl border p-4 transition-all hover:shadow-sm cursor-pointer",
                notif.read
                  ? "border-border-light bg-background"
                  : "border-primary/20 bg-primary-50/30"
              )}
            >
              <div className={cn("flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg", config.color)}>
                {config.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={cn("text-sm", notif.read ? "font-medium text-foreground" : "font-bold text-foreground")}>
                    {notif.title}
                  </p>
                  <span className="text-xs text-muted-foreground flex-shrink-0 mt-0.5">{notif.date}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notif.message}</p>
              </div>
              {!notif.read && (
                <div className="h-2 w-2 flex-shrink-0 rounded-full bg-primary mt-2" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
