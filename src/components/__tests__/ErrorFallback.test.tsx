/**
 * @vitest-environment jsdom
 *
 * Error boundary fallback (audit P1-8): no blank screen, a retry that renders
 * the server part again, the support reference, never the error message.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ErrorFallback } from "@/components/ErrorFallback";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

afterEach(() => vi.restoreAllMocks());

describe("ErrorFallback", () => {
  it("offers a retry that refreshes the server render and resets the boundary", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const reset = vi.fn();
    const error = Object.assign(new Error("SQLSTATE[42P01] relation missing"), { digest: "1234567" });

    render(<ErrorFallback error={error} reset={reset} />);

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Référence : 1234567")).toBeInTheDocument();
    expect(screen.queryByText(/SQLSTATE/)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Retour à l'accueil" })).toHaveAttribute("href", "/");

    await userEvent.click(screen.getByRole("button", { name: "Réessayer" }));

    expect(refresh).toHaveBeenCalledTimes(1);
    expect(reset).toHaveBeenCalledTimes(1);
  });
});
