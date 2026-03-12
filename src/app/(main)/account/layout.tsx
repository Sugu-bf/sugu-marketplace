import { redirect } from "next/navigation";
import { Container } from "@/components/ui";
import { getAuthUser } from "@/lib/api/auth";
import { queryAccountPageData } from "@/features/account";
import { AccountSidebar } from "@/features/account/components/AccountSidebar";

/**
 * Shared layout for all /account/* pages.
 * Renders the sidebar once, each sub-page fills the content area.
 * Auth guard: redirects to login if not authenticated.
 */
export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // ── Auth guard ──
  const user = await getAuthUser();
  if (!user) {
    redirect("/login?redirect=/account");
  }

  const data = await queryAccountPageData();

  return (
    <main className="pb-12">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* ═══ Sidebar — shared across all account pages ═══ */}
          <div className="lg:col-span-1">
            <AccountSidebar profile={data.profile} />
          </div>

          {/* ═══ Content — filled by each sub-page ═══ */}
          <div className="lg:col-span-3">{children}</div>
        </div>
      </Container>
    </main>
  );
}
