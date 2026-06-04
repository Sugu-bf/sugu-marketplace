// @vitest-environment jsdom
/**
 * WishlistProvider — Lot 3. Mount orchestration: rehydrate once, replicate
 * query data → store (one-way) with anti-double-replace. Bootstrap + merge
 * hooks are mocked so this is a focused provider unit test.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen } from "@/test/render";
import { useFavoritesStore } from "../../store/favorites-store";

vi.mock("../../queries/use-favorites-bootstrap", () => ({
  useFavoritesBootstrap: vi.fn(() => ({ data: undefined })),
}));
vi.mock("../../hooks/use-merge-favorites-on-login", () => ({
  useMergeFavoritesOnLogin: vi.fn(),
}));

import { useFavoritesBootstrap } from "../../queries/use-favorites-bootstrap";
import { WishlistProvider } from "../WishlistProvider";

type Boot = { data: { ids: string[]; updatedAt: string | null; etag: string | null } | undefined };
const mockBoot = (data: Boot["data"]) =>
  vi.mocked(useFavoritesBootstrap).mockReturnValue({ data } as ReturnType<typeof useFavoritesBootstrap>);

beforeEach(() => {
  localStorage.clear();
  useFavoritesStore.setState({ favoriteSet: new Set<string>() });
  mockBoot(undefined);
  vi.spyOn(useFavoritesStore.persist, "rehydrate").mockResolvedValue(undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("WishlistProvider", () => {
  it("renders children", () => {
    render(
      <WishlistProvider>
        <div>child content</div>
      </WishlistProvider>,
    );
    expect(screen.getByText("child content")).toBeInTheDocument();
  });

  it("triggers Zustand persist rehydration once on mount", () => {
    const rehydrateSpy = useFavoritesStore.persist.rehydrate as ReturnType<typeof vi.fn>;
    render(<WishlistProvider>x</WishlistProvider>);
    expect(rehydrateSpy).toHaveBeenCalledTimes(1);
  });

  it("replicates query data ids to the store via replaceAll", () => {
    mockBoot({ ids: ["a", "b"], updatedAt: "t", etag: '"v1"' });
    const replaceSpy = vi.spyOn(useFavoritesStore.getState(), "replaceAll");

    render(<WishlistProvider>x</WishlistProvider>);

    expect(replaceSpy).toHaveBeenCalledWith(["a", "b"]);
    expect(useFavoritesStore.getState().has("a")).toBe(true);
  });

  it("does not re-replicate when query data signature is unchanged (etag stable)", () => {
    mockBoot({ ids: ["a"], updatedAt: "t", etag: '"v1"' });
    const replaceSpy = vi.spyOn(useFavoritesStore.getState(), "replaceAll");

    const { rerender } = render(<WishlistProvider>x</WishlistProvider>);
    expect(replaceSpy).toHaveBeenCalled(); // initial replication happened
    replaceSpy.mockClear();

    // New object, identical etag → same signature → must skip on rerender.
    mockBoot({ ids: ["a"], updatedAt: "t", etag: '"v1"' });
    rerender(<WishlistProvider>x</WishlistProvider>);

    expect(replaceSpy).not.toHaveBeenCalled();
  });
});
