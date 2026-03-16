import { getAuthUser } from "@/lib/api/auth";
import { redirect } from "next/navigation";
import { MessagingPage } from "@/features/messaging/components/MessagingPage";

export const dynamic = "force-dynamic";

/**
 * Messages page — server component that passes auth user to the client MessagingPage.
 */
export default async function MessagesPageRoute() {
  const user = await getAuthUser();
  if (!user) {
    redirect("/login?redirect=/messages");
  }

  return <MessagingPage user={user} />;
}
