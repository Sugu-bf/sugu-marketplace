import { createMetadata } from "@/lib/metadata";
import { Breadcrumb } from "@/components/ui";
import { queryNotifications } from "@/features/account";
import { NotificationsClient } from "@/features/account/components/NotificationsClient";

export const metadata = createMetadata({ title: "Notifications", description: "Consultez vos notifications sur Sugu.", path: "/account/notifications", noIndex: true });

export default async function NotificationsPage() {
  const notifData = await queryNotifications();

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "Mon compte", href: "/account" }, { label: "Notifications" }]} />
      <NotificationsClient initialData={notifData} />
    </div>
  );
}
