// @vitest-environment jsdom
/**
 * Smoke test for the test harness itself — Lot 1.
 *
 * Validates in one go: RTL is wired, jsdom is active, jest-dom matchers are
 * available, and renderWithProviders mounts through QueryClientProvider
 * without error.
 */
import { describe, it, expect } from "vitest";
import { renderWithProviders, screen } from "@/test/render";

describe("test harness", () => {
  it("renders a component through renderWithProviders and uses jest-dom matchers", () => {
    renderWithProviders(<div>Hello harness</div>);
    expect(screen.getByText("Hello harness")).toBeInTheDocument();
  });
});
