// @vitest-environment jsdom
/**
 * Reliability of group buying on the page: large reservations pay first
 * (online, before a deadline), the others wait; trust ceilings cap what a
 * person may reserve; a sanction is explained, never a surprise.
 */
import { beforeAll, describe, expect, it, vi } from "vitest";
import { fireEvent, render, renderWithProviders, screen, waitFor } from "@/test/render";
import { GroupBuyPageClient } from "../components/GroupBuyPageClient";
import { GroupBuyStandingCard } from "../components/GroupBuyStandingCard";
import { LaunchGroupDialog } from "../components/LaunchGroupDialog";
import type { GroupBuyOffer, MyGroupBuyStanding } from "../api/group-buy.schemas";
import { CONFIRM_RULES, groupResponse, membership, viewerStanding } from "./fixtures";

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

const standingMock = vi.hoisted(() => ({ fetch: vi.fn() }));
vi.mock("../api/group-buy.api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../api/group-buy.api")>();
  return { ...actual, fetchMyGroupBuyStanding: standingMock.fetch };
});

const props = { isSignedIn: true, refCode: null, justLaunched: false, sessionExpired: false };
const DEADLINE = "2026-11-07T00:00:00+00:00";

const confirming = {
  status: "confirming" as const,
  current_unit_price: 590_000,
  current_tier_min_qty: 3,
  next_tier: null,
  confirm_deadline_at: DEADLINE,
  can_join: false,
  confirm_rules: CONFIRM_RULES,
};

describe("while the large reservations confirm the price", () => {
  it("asks a member who pays first to pay online, with the deadline and what missing it costs", () => {
    render(
      <GroupBuyPageClient
        {...props}
        initial={groupResponse({
          ...confirming,
          my_membership: membership({
            qty: 6,
            must_confirm: true,
            confirm_reason: "bulk",
            online_payment_only: true,
            can_order: true,
            my_share_amount: 3_540_000,
            order_deadline_at: DEADLINE,
          }),
        })}
      />,
    );

    const pay = screen.getByRole("button", { name: /Payer ma part en ligne/ });
    expect(pay.textContent?.replace(/\D/g, "")).toContain("35400");
    expect(screen.getByText(/votre place est libérée et cela compte comme un abandon/)).toBeInTheDocument();
    expect(screen.getByText("Confirmation du prix")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Commander ma part/ })).not.toBeInTheDocument();
  });

  it("tells the other members to wait, and that they order right after", () => {
    render(<GroupBuyPageClient {...props} initial={groupResponse({ ...confirming, my_membership: membership() })} />);

    expect(screen.getByText(/Les grosses réservations confirment le prix jusqu’à/)).toBeInTheDocument();
    expect(screen.getByText(/vous pourrez commander juste après/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Payer|Commander/ })).not.toBeInTheDocument();
  });

  it("closes the group to a visitor", () => {
    render(<GroupBuyPageClient {...props} initial={groupResponse({ ...confirming, my_membership: null })} />);

    expect(screen.getByText(/fermé aux nouveaux membres/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Rejoindre/ })).not.toBeInTheDocument();
  });

  it("asks a member whose order is not paid yet to finish the payment", () => {
    render(
      <GroupBuyPageClient
        {...props}
        initial={groupResponse({
          ...confirming,
          my_membership: membership({
            status: "ordered",
            must_confirm: true,
            confirm_reason: "bulk",
            order_deadline_at: DEADLINE,
            order: { id: "01JORDER", number: "SG-1", status: "pending", payment_status: "unpaid" },
          }),
        })}
      />,
    );

    expect(screen.getByRole("link", { name: /Terminer le paiement/ })).toHaveAttribute("href", "/track-order?order=01JORDER");
  });
});

describe("once the price is locked", () => {
  it("shows how many members already ordered, and that a place left unordered counts", () => {
    render(
      <GroupBuyPageClient
        {...props}
        initial={groupResponse({
          status: "locked",
          members_count: 5,
          ordered_count: 3,
          next_tier: null,
          order_deadline_at: "2026-11-08T12:00:00+00:00",
          can_join: false,
          my_membership: membership({ can_order: true }),
        })}
      />,
    );

    expect(screen.getByText(/3 membres sur 5 ont déjà commandé/)).toBeInTheDocument();
    expect(screen.getByText(/sans commande avant la fin du délai, cela compte comme un abandon/)).toBeInTheDocument();
  });
});

describe("trust ceilings on the join form", () => {
  it("caps the quantity at what the viewer may hold here and says why", () => {
    render(<GroupBuyPageClient {...props} initial={groupResponse({ my_standing: viewerStanding({ max_qty_here: 2 }) })} />);

    expect(screen.getByText(/Votre niveau Nouveau : jusqu’à 2 unités ici/)).toBeInTheDocument();
    expect(screen.getByText(/Si le prix est obtenu et que vous ne commandez pas, cela compte comme un abandon/)).toBeInTheDocument();
    const increase = screen.getByRole("button", { name: "Augmenter la quantité" });
    fireEvent.click(increase);
    fireEvent.click(increase);
    expect(increase).toBeDisabled();
    expect(screen.getByText(/Votre part estimée/).textContent?.replace(/\D/g, "")).toContain("11800");
  });

  it("warns before someone reserves a quantity that pays first", () => {
    render(
      <GroupBuyPageClient
        {...props}
        initial={groupResponse({ confirm_rules: { ...CONFIRM_RULES, amount: 500_000 }, my_standing: viewerStanding() })}
      />,
    );

    expect(screen.getByText(/Avec cette quantité, vous paierez votre part en ligne en premier/)).toBeInTheDocument();
  });

  it("explains a suspension instead of the join form", () => {
    render(
      <GroupBuyPageClient
        {...props}
        initial={groupResponse({
          can_join: false,
          my_standing: viewerStanding({ suspended_until: "2026-12-06T12:00:00+00:00", block: "suspended", active_strikes: 2 }),
        })}
      />,
    );

    expect(screen.getByText(/jusqu’au 06\/12\/2026/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Voir ma fiabilité/ })).toHaveAttribute("href", "/account/achats-groupes");
    expect(screen.queryByRole("button", { name: /Rejoindre/ })).not.toBeInTheDocument();
  });

  it("explains a reached ceiling", () => {
    render(
      <GroupBuyPageClient
        {...props}
        initial={groupResponse({ can_join: false, my_standing: viewerStanding({ max_qty_here: 0, block: "ceiling" }) })}
      />,
    );

    expect(screen.getByText(/Commandez ou libérez une place dans un autre groupe/)).toBeInTheDocument();
  });

  it("offers a member to leave rather than leave the place unordered", () => {
    render(
      <GroupBuyPageClient
        {...props}
        initial={groupResponse({ my_membership: membership({ can_leave: true, can_change_qty: true }), can_join: false })}
      />,
    );

    expect(screen.getByText(/Quittez le groupe plutôt que de laisser votre place sans commande/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Quitter le groupe/ })).toBeEnabled();
  });
});

describe("launching a group", () => {
  // jsdom has no modal dialogs: open them as plain dialogs.
  beforeAll(() => {
    HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) {
      this.open = true;
    };
    HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) {
      this.open = false;
    };
  });

  const offer: Extract<GroupBuyOffer, { groupable: true }> = {
    groupable: true,
    product_id: "P1",
    variant_id: "V1",
    currency: "XOF",
    base_unit_price: 650_000,
    best_unit_price: 540_000,
    best_saving_percent: 17,
    tiers: [
      { min_qty: 10, unit_price: 590_000, saving_percent: 9 },
      { min_qty: 20, unit_price: 540_000, saving_percent: 17 },
    ],
    max_qty: 100,
    min_order_quantity: 1,
    delivery_modes: ["individual"],
    open_hours: 48,
    max_member_qty: 15,
    confirm_rules: CONFIRM_RULES,
    open_groups: [],
  };

  it("caps the quantity by the customer's ceiling and says so", async () => {
    standingMock.fetch.mockResolvedValue({ ...viewerStanding({ available_amount: 1_950_000 }), strikes: [], rules: null });

    renderWithProviders(<LaunchGroupDialog open onClose={() => undefined} offer={offer} productId="P1" variantId={null} />);

    expect(await screen.findByText(/Votre niveau Nouveau : jusqu’à 3 unités ici/, {}, { timeout: 5_000 })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Lancer le groupe/ })).toBeEnabled();
  });

  it("explains a suspension and does not offer to launch", async () => {
    standingMock.fetch.mockResolvedValue({
      ...viewerStanding({ suspended_until: "2099-01-01T00:00:00+00:00" }),
      strikes: [],
      rules: null,
    });

    renderWithProviders(<LaunchGroupDialog open onClose={() => undefined} offer={offer} productId="P1" variantId={null} />);

    expect(await screen.findByText(/vous ne pouvez plus rejoindre ni lancer de groupe/, {}, { timeout: 5_000 })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Lancer le groupe/ })).toBeDisabled();
  });

  it("works for a guest: no standing, no hint", async () => {
    standingMock.fetch.mockRejectedValue(new Error("401"));

    renderWithProviders(<LaunchGroupDialog open onClose={() => undefined} offer={offer} productId="P1" variantId={null} />);

    await waitFor(() => expect(standingMock.fetch).toHaveBeenCalled(), { timeout: 5_000 });
    expect(screen.queryByText(/Votre niveau/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Lancer le groupe/ })).toBeEnabled();
  });
});

describe("Ma fiabilité", () => {
  const standing: MyGroupBuyStanding = {
    ...viewerStanding({ active_strikes: 1, prepay_required: true }),
    strikes: [
      {
        id: "S1",
        reason: "no_show",
        label: "Pas de commande après le prix obtenu",
        group_code: "K7M2Q9XA",
        at: "2026-10-01T10:00:00+00:00",
        counts_until: "2026-12-30T10:00:00+00:00",
        voided: false,
      },
      {
        id: "S2",
        reason: "cod_refused",
        label: "Colis refusé à la livraison",
        group_code: null,
        at: "2026-09-01T10:00:00+00:00",
        counts_until: null,
        voided: true,
      },
    ],
    rules: {
      strike_window_days: 90,
      suspend_after_strikes: 2,
      suspension_days: 30,
      prepay_after_strikes: 3,
      long_suspension_days: 90,
      ...CONFIRM_RULES,
    },
  };

  it("shows the level, the ceiling, each strike and the rules", () => {
    render(<GroupBuyStandingCard standing={standing} />);

    expect(screen.getByText("Niveau Nouveau")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "13");
    expect(screen.getByText(/1 abandon compte en ce moment/)).toBeInTheDocument();
    expect(screen.getByText("Pas de commande après le prix obtenu")).toBeInTheDocument();
    expect(screen.getByText(/Compte jusqu’au 30\/12\/2026/)).toBeInTheDocument();
    expect(screen.getByText("Annulé par Sugu")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /groupe K7M2Q9XA/ })).toHaveAttribute("href", "/groupe/K7M2Q9XA");
    expect(screen.getByText(/Paiement d’avance/)).toBeInTheDocument();
    expect(screen.getByText(/À 2 abandons : pas de nouveau groupe pendant 30 jours/)).toBeInTheDocument();
  });
});
