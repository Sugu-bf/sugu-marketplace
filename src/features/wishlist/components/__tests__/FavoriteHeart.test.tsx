// @vitest-environment jsdom
/**
 * FavoriteHeart — Lot 4. Overlay heart: a11y, no-navigation, guest local
 * toggle, optimistic revert + locked FR toast, SSR/hydration safety.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderWithProviders, screen, fireEvent, waitFor, act } from "@/test/render";
import { http, HttpResponse, delay } from "msw";
import { server } from "@/test/msw/server";
import { setupMswServer } from "@/test/msw/setup";
import { API_BASE_URL } from "@/lib/api/config";
import { hasAuthSession } from "@/features/auth/services/auth-service";
import { useToast } from "@/features/toast/toast-store";
import { useFavoritesStore } from "../../store/favorites-store";
import { __clearToggleMutex } from "../../hooks/use-toggle-favorite";
import { FavoriteHeart } from "../FavoriteHeart";

vi.mock("@/features/auth/services/auth-service", () => ({
  hasAuthSession: vi.fn(() => true),
}));

setupMswServer();

const STORAGE_KEY = "sugu_favorites_guest_v1";
const favUrl = (id: string) => `${API_BASE_URL}/api/v1/mobile/favorites/${id}`;

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  useFavoritesStore.setState({ favoriteSet: new Set<string>() });
  useToast.setState({ toasts: [] });
  __clearToggleMutex();
  vi.mocked(hasAuthSession).mockReturnValue(true);
});

const addBtn = () => screen.getByRole("button", { name: "Ajouter aux favoris" });
const removeBtn = () => screen.getByRole("button", { name: "Retirer des favoris" });
const heartSvg = (btn: HTMLElement) => btn.querySelector("svg") as SVGElement;

describe("FavoriteHeart", () => {
  it("renders an empty heart when product is not favorited", () => {
    renderWithProviders(<FavoriteHeart productId="p" />);
    const btn = addBtn();
    expect(btn).toHaveAttribute("aria-pressed", "false");
    expect(heartSvg(btn).getAttribute("class")).toContain("text-gray-700");
  });

  it("renders a filled red heart when product is favorited", () => {
    act(() => useFavoritesStore.getState().add("p"));
    renderWithProviders(<FavoriteHeart productId="p" />);
    const btn = removeBtn();
    expect(btn).toHaveAttribute("aria-pressed", "true");
    expect(heartSvg(btn).getAttribute("class")).toContain("text-red-500");
    expect(heartSvg(btn).getAttribute("class")).toContain("fill-current");
  });

  it("toggles favorite on click (optimistic flip)", async () => {
    server.use(http.post(favUrl("p"), () => new HttpResponse(null, { status: 204 })));
    renderWithProviders(<FavoriteHeart productId="p" />);

    fireEvent.click(addBtn());

    expect(useFavoritesStore.getState().has("p")).toBe(true);
    await waitFor(() => expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "true"));
  });

  it("does NOT trigger navigation when heart is clicked", () => {
    vi.mocked(hasAuthSession).mockReturnValue(false); // guest path: local only, no network
    const onParentClick = vi.fn();
    renderWithProviders(
      <a href="https://example.test/product" onClick={onParentClick}>
        <FavoriteHeart productId="p" />
      </a>,
    );

    const event = fireEvent.click(addBtn());

    expect(onParentClick).not.toHaveBeenCalled(); // stopPropagation
    expect(event).toBe(false); // preventDefault returned false from dispatchEvent
  });

  it("has correct aria-label reflecting current state", () => {
    const { rerender } = renderWithProviders(<FavoriteHeart productId="p" />);
    expect(screen.getByLabelText("Ajouter aux favoris")).toBeInTheDocument();

    act(() => useFavoritesStore.getState().add("p"));
    rerender(<FavoriteHeart productId="p" />);
    expect(screen.getByLabelText("Retirer des favoris")).toBeInTheDocument();
  });

  it("has aria-pressed reflecting current state", () => {
    renderWithProviders(<FavoriteHeart productId="p" />);
    expect(addBtn()).toHaveAttribute("aria-pressed", "false");
  });

  it("has aria-busy=true during mutation", async () => {
    server.use(
      http.post(favUrl("p"), async () => {
        await delay(150); // keep the mutation pending long enough to observe
        return new HttpResponse(null, { status: 204 });
      }),
    );
    renderWithProviders(<FavoriteHeart productId="p" />);

    fireEvent.click(addBtn());

    await waitFor(() => expect(screen.getByRole("button")).toHaveAttribute("aria-busy", "true"));
    await waitFor(() => expect(screen.getByRole("button")).toHaveAttribute("aria-busy", "false"));
  });

  it("allows toggling for guest users (no auth check on the heart)", async () => {
    vi.mocked(hasAuthSession).mockReturnValue(false);
    let requested = false;
    server.use(
      http.post(favUrl("p"), () => {
        requested = true;
        return new HttpResponse(null, { status: 401 });
      }),
    );
    renderWithProviders(<FavoriteHeart productId="p" />);

    fireEvent.click(addBtn());

    expect(useFavoritesStore.getState().has("p")).toBe(true);
    await waitFor(() => expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "true"));
    await Promise.resolve();
    expect(requested).toBe(false);
    expect(useToast.getState().toasts).toHaveLength(0);
  });

  it("reverts visual state on mutation error and shows toast", async () => {
    server.use(http.post(favUrl("p"), () => new HttpResponse(null, { status: 500 })));
    renderWithProviders(<FavoriteHeart productId="p" />);

    fireEvent.click(addBtn());
    expect(useFavoritesStore.getState().has("p")).toBe(true); // optimistic

    await waitFor(() => expect(useFavoritesStore.getState().has("p")).toBe(false)); // reverted
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "false");
  });

  it("shows exact FR toast message on add failure", async () => {
    server.use(http.post(favUrl("p"), () => new HttpResponse(null, { status: 500 })));
    renderWithProviders(<FavoriteHeart productId="p" />);

    fireEvent.click(addBtn());

    await waitFor(() =>
      expect(
        useToast.getState().toasts.some((t) => t.message === "Impossible d'ajouter aux favoris"),
      ).toBe(true),
    );
  });

  it("shows exact FR toast message on remove failure", async () => {
    act(() => useFavoritesStore.getState().add("p"));
    server.use(http.delete(favUrl("p"), () => new HttpResponse(null, { status: 500 })));
    renderWithProviders(<FavoriteHeart productId="p" />);

    fireEvent.click(removeBtn());

    await waitFor(() =>
      expect(
        useToast.getState().toasts.some((t) => t.message === "Impossible de retirer des favoris"),
      ).toBe(true),
    );
  });

  it("does not cause hydration mismatch (initial render = empty heart despite persisted state)", () => {
    // Persisted guest favorites exist in localStorage, but the store uses
    // skipHydration — without an explicit rehydrate the initial render is empty,
    // matching the server render (no mismatch).
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ state: { ids: ["p"] }, version: 1 }));

    renderWithProviders(<FavoriteHeart productId="p" />);

    expect(addBtn()).toHaveAttribute("aria-pressed", "false");
  });
});
