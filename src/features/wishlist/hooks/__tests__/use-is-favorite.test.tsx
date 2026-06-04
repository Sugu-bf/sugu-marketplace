// @vitest-environment jsdom
/**
 * useIsFavorite — Lot 3. Reactivity & cross-id render isolation (React
 * Compiler + Zustand primitive-selector contract). No network.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { act, render } from "@/test/render";
import { useFavoritesStore } from "../../store/favorites-store";
import { useIsFavorite } from "../use-is-favorite";

beforeEach(() => {
  localStorage.clear();
  useFavoritesStore.setState({ favoriteSet: new Set<string>() });
});

function Probe({ id, onRender }: { id: string; onRender: (id: string, fav: boolean) => void }) {
  const isFav = useIsFavorite(id);
  onRender(id, isFav);
  return <span data-testid={id}>{isFav ? "1" : "0"}</span>;
}

describe("useIsFavorite", () => {
  it("returns boolean false for an unknown id", () => {
    const spy = vi.fn();
    render(<Probe id="x" onRender={spy} />);
    expect(spy).toHaveBeenLastCalledWith("x", false);
  });

  it("returns boolean true when id is in the store", () => {
    act(() => {
      useFavoritesStore.getState().add("x");
    });
    const spy = vi.fn();
    render(<Probe id="x" onRender={spy} />);
    expect(spy).toHaveBeenLastCalledWith("x", true);
  });

  it("re-renders consumer when the specific id is added", () => {
    const spy = vi.fn();
    render(<Probe id="a" onRender={spy} />);
    expect(spy).toHaveBeenLastCalledWith("a", false);
    spy.mockClear();

    act(() => {
      useFavoritesStore.getState().add("a");
    });

    expect(spy).toHaveBeenCalledWith("a", true);
  });

  it("does NOT re-render unrelated consumers when one id changes", () => {
    const spyA = vi.fn();
    const spyB = vi.fn();
    render(
      <>
        <Probe id="a" onRender={spyA} />
        <Probe id="b" onRender={spyB} />
      </>,
    );
    spyA.mockClear();
    spyB.mockClear();

    act(() => {
      useFavoritesStore.getState().add("a");
    });

    expect(spyA).toHaveBeenCalledTimes(1); // a flipped → re-render
    expect(spyB).not.toHaveBeenCalled(); // b unaffected → no re-render
  });
});
