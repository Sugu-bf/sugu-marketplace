// @vitest-environment jsdom
/**
 * Group buying components: the gauge says where the group stands, the card
 * links to the group, and the action panel offers only what the member may do.
 */
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/render";
import { GroupBuyProgress } from "../components/GroupBuyProgress";
import { GroupBuyCard } from "../components/GroupBuyCard";
import { GroupBuyPageClient } from "../components/GroupBuyPageClient";
import { groupDetail, groupResponse } from "./fixtures";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/groupe/K7M2Q9XA",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/lib/echo", () => ({
  getEcho: () => {
    throw new Error("no realtime in tests");
  },
}));

describe("GroupBuyProgress", () => {
  it("reports the reserved quantity and marks the tiers reached", () => {
    render(
      <GroupBuyProgress
        reservedQty={3}
        tiers={[
          { min_qty: 3, unit_price: 590_000, saving_percent: 9 },
          { min_qty: 5, unit_price: 540_000, saving_percent: 17 },
        ]}
      />,
    );

    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuenow", "3");
    expect(bar).toHaveAttribute("aria-valuemax", "5");
    expect(screen.getByText("palier atteint")).toBeInTheDocument();
    expect(screen.getByText("palier à atteindre")).toBeInTheDocument();
  });
});

describe("GroupBuyCard", () => {
  it("links to the group and shows what it misses", () => {
    render(<GroupBuyCard group={groupDetail()} />);

    expect(screen.getByRole("link")).toHaveAttribute("href", "/groupe/K7M2Q9XA");
    expect(screen.getByText(/Plus que 1 pour passer/)).toBeInTheDocument();
  });
});

describe("GroupBuyPageClient", () => {
  const props = { isSignedIn: true, refCode: null, justLaunched: false, sessionExpired: false };

  it("asks a guest to sign in before joining", () => {
    render(<GroupBuyPageClient {...props} isSignedIn={false} initial={groupResponse({ can_join: false })} />);

    expect(screen.getByRole("button", { name: /Se connecter pour rejoindre/ })).toBeInTheDocument();
  });

  it("lets a signed-in visitor join, for free", () => {
    render(<GroupBuyPageClient {...props} initial={groupResponse()} />);

    expect(screen.getByRole("button", { name: /Rejoindre le groupe/ })).toBeEnabled();
    expect(screen.getByText(/Rien à payer maintenant/)).toBeInTheDocument();
  });

  it("offers to order the part once the price is locked, at the member's own amount", () => {
    render(
      <GroupBuyPageClient
        {...props}
        initial={groupResponse({
          status: "locked",
          current_unit_price: 590_000,
          next_tier: null,
          order_deadline_at: "2026-11-08T12:00:00+00:00",
          can_join: false,
          my_membership: {
            qty: 2,
            status: "reserved",
            is_initiator: false,
            can_leave: false,
            can_change_qty: false,
            can_order: true,
            order_qty: 2,
            my_share_amount: 1_180_000,
            order: null,
            joined_at: "2026-11-05T13:00:00+00:00",
          },
        })}
      />,
    );

    const button = screen.getByRole("button", { name: /Commander ma part/ });
    expect(button.textContent?.replace(/\D/g, "")).toContain("11800");
    expect(screen.queryByRole("button", { name: /Rejoindre le groupe/ })).not.toBeInTheDocument();
  });

  it("tells a grouped-delivery member that the initiator orders, not them", () => {
    render(
      <GroupBuyPageClient
        {...props}
        initial={groupResponse({
          status: "locked",
          delivery_mode: "grouped",
          next_tier: null,
          can_join: false,
          my_membership: {
            qty: 1,
            status: "reserved",
            is_initiator: false,
            can_leave: false,
            can_change_qty: false,
            can_order: false,
            order_qty: 3,
            my_share_amount: 590_000,
            order: null,
            joined_at: null,
          },
        })}
      />,
    );

    expect(screen.getByText(/L’initiateur commande pour tout le groupe/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Commander/ })).not.toBeInTheDocument();
  });

  it("lets a member of a group that failed relaunch it", () => {
    render(
      <GroupBuyPageClient
        {...props}
        initial={groupResponse({
          status: "failed",
          next_tier: null,
          can_join: false,
          my_membership: {
            qty: 1,
            status: "reserved",
            is_initiator: true,
            can_leave: false,
            can_change_qty: false,
            can_order: false,
            order_qty: 1,
            my_share_amount: 650_000,
            order: null,
            joined_at: null,
          },
        })}
      />,
    );

    expect(screen.getByRole("button", { name: /Relancer le groupe/ })).toBeInTheDocument();
    expect(screen.getByText(/Personne n’a rien payé/)).toBeInTheDocument();
  });

  it("never tells the member of a failed group that they missed their order", () => {
    render(
      <GroupBuyPageClient
        {...props}
        initial={groupResponse({
          status: "failed",
          next_tier: null,
          can_join: false,
          my_membership: {
            qty: 1,
            status: "expired",
            is_initiator: false,
            can_leave: false,
            can_change_qty: false,
            can_order: false,
            order_qty: 1,
            my_share_amount: 650_000,
            order: null,
            joined_at: null,
          },
        })}
      />,
    );

    expect(screen.queryByText(/pas commandé votre part à temps/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Relancer le groupe/ })).toBeInTheDocument();
  });
});
