import { redirect } from "next/navigation";
import { Container } from "@/components/ui";
import { getAuthState } from "@/lib/api/auth";
import { ServiceUnavailable } from "@/components/ServiceUnavailable";
import { queryAccountPageData } from "@/features/account";
import { AccountSidebar } from "@/features/account/components/AccountSidebar";

/** All /account pages require auth → never static-renderable */
export const dynamic = "force-dynamic";

/**
 * Shared layout for all /account/* pages.
 * Renders the sidebar once, each sub-page fills the content area.
 * Auth guard: redirects to login if not authenticated; while the backend
 * cannot tell, shows a "service unavailable" page instead of a raw 500.
 */
export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // ── Auth guard ──
  const auth = await getAuthState();
  if (auth.status === "unauthenticated") {
    redirect("/login?redirect=/account");
  }
  if (auth.status === "unavailable") {
    return <ServiceUnavailable retryHref="/account" />;
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
