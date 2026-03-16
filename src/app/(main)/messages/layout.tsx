import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/api/auth";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Messages",
  description: "Consultez et gérez vos conversations avec les vendeurs sur Sugu.",
};

/**
 * Messages layout — auth guard + full-height container.
 * Does NOT use the account sidebar — chat fills the full width.
 */
export default async function MessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAuthUser();
  if (!user) {
    redirect("/login?redirect=/messages");
  }

  return (
    <div className="h-[calc(100dvh-64px)] overflow-hidden">
      {children}
    </div>
  );
}
