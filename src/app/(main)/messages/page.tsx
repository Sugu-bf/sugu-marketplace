import type { Metadata } from "next";
import { getAuthUser } from "@/lib/api/auth";
import { redirect } from "next/navigation";
import { MessagingPage } from "@/features/messaging/components/MessagingPage";

export const dynamic = "force-dynamic";

// Matches the X-Robots-Tag set for /messages/* in next.config.ts — without it
// the page inherited the root layout's `index, follow`.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

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
