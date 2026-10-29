// @vitest-environment jsdom
/**
 * P1-2 (audit 2026-10-29) — once a number has been checked too often, the
 * backend answers 429 with Retry-After. The page says "trop de tentatives"
 * with the wait, and never concludes that the number has no account (it used
 * to send the owner to a sign-up that fails).
 */
import { describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw/server";
import { setupMswServer } from "@/test/msw/setup";
import { API_BASE_URL } from "@/lib/api/config";
import { renderWithProviders, screen, fireEvent } from "@/test/render";
import { LoginPageClient } from "../components/LoginPageClient";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("../components/GoogleSignInButton", () => ({
  GoogleSignInButton: () => null,
}));

setupMswServer();

const CHECK_PHONE_URL = `${API_BASE_URL}/api/v1/web-auth/check-phone`;

describe("LoginPageClient — a limited number", () => {
  it("shows a wait instead of an unknown number on a 429", async () => {
    server.use(
      http.post(CHECK_PHONE_URL, () =>
        HttpResponse.json(
          { success: false, message: "Trop de tentatives pour ce numéro.", error_code: "AUTH_047", retry_after: 540 },
          { status: 429, headers: { "Retry-After": "540" } },
        ),
      ),
    );
    renderWithProviders(<LoginPageClient socialProviders={[]} />);

    fireEvent.change(screen.getByLabelText("Numéro de téléphone"), { target: { value: "70 11 13 33" } });
    fireEvent.click(screen.getByRole("button", { name: /Continuer/ }));

    expect(await screen.findByText("Trop de tentatives")).toBeInTheDocument();
    expect(screen.getByText(/Réessayez dans 9 min/)).toBeInTheDocument();
    expect(screen.queryByText("Nouveau sur Sugu ?")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Continuer/ })).toBeDisabled();
  });
});
