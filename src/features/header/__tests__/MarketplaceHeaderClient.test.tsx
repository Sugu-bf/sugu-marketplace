// @vitest-environment jsdom
/**
 * The header's overlays and its logout:
 * - the mobile search is a modal dialog (focus on its field, Escape closes);
 * - the collapsed mobile menu keeps its links out of the tab order;
 * - logging out clears the browser's session state and reloads (audit P1-11).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithProviders, screen } from "@/test/render";
import userEvent from "@testing-library/user-event";

const resetClientSession = vi.fn(async () => {});
const logout = vi.fn(async () => {});

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));
vi.mock("@/lib/api/auth", () => ({
  getAuthUser: vi.fn(async () => ({ id: "1", name: "Awa Traoré", email: null, created_at: "2026-01-01" })),
  logout: () => logout(),
}));
vi.mock("@/lib/session/reset-client-session", () => ({
  resetClientSession: (destination: string) => resetClientSession(destination),
}));
vi.mock("@/features/auth/services/auth-service", () => ({ hasAuthSession: () => true }));
vi.mock("../hooks/useSearchSuggestions", () => ({
  useSearchSuggestions: () => ({ suggestions: [], products: [], isLoading: false, clear: vi.fn() }),
}));
vi.mock("../components/SearchBar", () => ({ default: () => null }));
vi.mock("../components/CategoriesMegaMenu", () => ({ default: () => null }));
vi.mock("../components/WishlistDropdown", () => ({ default: () => null }));
vi.mock("../components/CartDropdown", () => ({ default: () => null }));

import MarketplaceHeaderClient from "../components/MarketplaceHeaderClient";

beforeEach(() => {
  resetClientSession.mockClear();
  logout.mockClear();
});

function renderHeader() {
  return renderWithProviders(<MarketplaceHeaderClient categories={[]} popularSearches={[]} />);
}

describe("MarketplaceHeaderClient", () => {
  it("opens the mobile search as a modal dialog focused on its field", async () => {
    renderHeader();
    const opener = screen.getByRole("button", { name: "Ouvrir la recherche" });

    await userEvent.click(opener);
    const dialog = screen.getByRole("dialog", { name: "Rechercher sur Sugu" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toContainElement(document.activeElement as HTMLElement);
    expect(document.activeElement?.tagName).toBe("INPUT");

    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
  });

  it("keeps the collapsed mobile menu out of the tab order", async () => {
    const { container } = renderHeader();
    const toggle = screen.getByRole("button", { name: "Ouvrir le menu" });
    const menu = container.querySelector("#mobile-menu")!;

    expect(toggle).toHaveAttribute("aria-controls", "mobile-menu");
    expect(menu).toHaveAttribute("inert");

    await userEvent.click(toggle);
    expect(menu).not.toHaveAttribute("inert");
  });

  it("clears the browser's session state on logout", async () => {
    renderHeader();
    await userEvent.hover(await screen.findByRole("link", { name: "Mon compte" }));
    await userEvent.click(await screen.findByRole("button", { name: "Déconnexion" }));

    expect(logout).toHaveBeenCalledTimes(1);
    expect(resetClientSession).toHaveBeenCalledWith("/");
  });
});
