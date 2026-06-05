// @vitest-environment jsdom
/**
 * ProductCard + FavoriteHeart integration — Lot 4. Confirms the heart is wired
 * into the card without breaking the existing link / quick-add, and that a
 * favorite toggle in a grid re-renders ONLY the affected card's heart
 * (React Profiler perf isolation — critical for 100+ item grids).
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { Profiler } from "react";
import { renderWithProviders, screen, act } from "@/test/render";
import type { ProductListItem } from "@/features/product";
import { useFavoritesStore } from "@/features/wishlist";
import { ProductCard } from "../product-card";

vi.mock("@/features/auth/services/auth-service", () => ({ hasAuthSession: vi.fn(() => false) }));
vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element -- plain img mock for jsdom
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));
vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={typeof href === "string" ? href : "#"}>{children}</a>
  ),
}));

function makeProduct(overrides?: Partial<ProductListItem>): ProductListItem {
  return {
    id: "prod-1",
    slug: "prod-1",
    name: "Test Product",
    price: 1000,
    thumbnail: "/x.jpg",
    rating: 4,
    reviewCount: 10,
    stock: 5,
    sold: 2,
    vendorName: "Vendor",
    categoryName: "Cat",
    ...overrides,
  };
}

beforeEach(() => {
  localStorage.clear();
  useFavoritesStore.setState({ favoriteSet: new Set<string>() });
});

describe("ProductCard + FavoriteHeart", () => {
  it("renders FavoriteHeart inside ProductCard", () => {
    renderWithProviders(<ProductCard product={makeProduct()} />);
    expect(screen.getByRole("button", { name: "Ajouter aux favoris" })).toBeInTheDocument();
  });

  it("preserves existing ProductCard link navigation behavior", () => {
    renderWithProviders(<ProductCard product={makeProduct({ slug: "tomatoes" })} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/product/tomatoes");
  });

  it("preserves existing quick-add button behavior", () => {
    renderWithProviders(<ProductCard product={makeProduct({ name: "Bananes" })} />);
    expect(
      screen.getByRole("button", { name: "Ajouter Bananes au panier" }),
    ).toBeInTheDocument();
  });

  it("re-renders only the affected card heart when toggle occurs in a grid", () => {
    const updates: Record<string, number> = {};
    const onRender = (id: string, phase: "mount" | "update" | "nested-update") => {
      if (phase === "update") updates[id] = (updates[id] ?? 0) + 1;
    };

    const products = Array.from({ length: 10 }, (_, i) =>
      makeProduct({ id: `prod-${i}`, slug: `prod-${i}` }),
    );

    renderWithProviders(
      <>
        {products.map((p) => (
          <Profiler key={p.id} id={String(p.id)} onRender={onRender}>
            <ProductCard product={p} />
          </Profiler>
        ))}
      </>,
    );

    act(() => useFavoritesStore.getState().add("prod-3"));

    expect(Object.keys(updates)).toEqual(["prod-3"]);
  });

  it("does not break product-card rendering when productId is empty (defensive)", () => {
    renderWithProviders(<ProductCard product={makeProduct({ id: "" })} />);
    expect(screen.getByRole("button", { name: "Ajouter aux favoris" })).toBeInTheDocument();
  });
});
