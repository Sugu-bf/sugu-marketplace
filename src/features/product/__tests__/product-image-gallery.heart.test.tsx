// @vitest-environment jsdom
/**
 * Audit 2026-10-29 (catalogue low finding): the heart of the product page
 * gallery called the deprecated /wishlist/items API, always started empty,
 * and was not synced with the favorites of the cards, header and /wishlist.
 * It is now the shared FavoriteHeart, on the favorites store.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderWithProviders, screen } from "@/test/render";
import { useFavoritesStore } from "@/features/wishlist";
import { ProductImageGallery } from "../components/ProductImageGallery";

vi.mock("@/features/auth/services/auth-service", () => ({ hasAuthSession: vi.fn(() => false) }));
vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element -- plain img mock for jsdom
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

const images = [{ id: 1, url: "https://cdn.sugu.pro/s/p.png", alt: "Pagne" }];
const productId = "01JB8Z5K3M4N5P6Q7R8S9T0V1W";

beforeEach(() => {
  localStorage.clear();
  useFavoritesStore.setState({ favoriteSet: new Set<string>() });
});

describe("product gallery heart", () => {
  it("shows the product as a favorite when the favorites store has it", () => {
    useFavoritesStore.setState({ favoriteSet: new Set<string>([productId]) });

    renderWithProviders(<ProductImageGallery images={images} productName="Pagne" productId={productId} />);

    expect(screen.getByRole("button", { name: "Retirer des favoris" })).toHaveAttribute("aria-pressed", "true");
  });

  it("toggles the shared favorites store, never the legacy wishlist API", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    renderWithProviders(<ProductImageGallery images={images} productName="Pagne" productId={productId} />);

    screen.getByRole("button", { name: "Ajouter aux favoris" }).click();

    await vi.waitFor(() => expect(useFavoritesStore.getState().favoriteSet.has(productId)).toBe(true));
    const urls = fetchSpy.mock.calls.map(([input]) => String(input));
    expect(urls.some((url) => url.includes("/wishlist/items"))).toBe(false);
    fetchSpy.mockRestore();
  });
});
