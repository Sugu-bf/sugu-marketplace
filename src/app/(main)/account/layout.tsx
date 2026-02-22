import { Container } from "@/components/ui";
import { queryAccountPageData } from "@/features/account";
import { AccountSidebar } from "@/features/account/components/AccountSidebar";

/**
 * Shared layout for all /account/* pages.
 * Renders the sidebar once, each sub-page fills the content area.
 */
export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
