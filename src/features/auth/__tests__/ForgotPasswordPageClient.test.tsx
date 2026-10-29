// @vitest-environment jsdom
/**
 * Password reset goes by e-mail only. A phone account has no password: it
 * signs in with the code received by SMS. The phone tab used to send a paid
 * SMS and then fail every time, because the reset endpoint requires an e-mail.
 */
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders, screen } from "@/test/render";
import { ForgotPasswordPageClient } from "../components/ForgotPasswordPageClient";
import { passwordPolicyError } from "../models/password-policy";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

describe("ForgotPasswordPageClient", () => {
  it("asks for an e-mail only and sends phone accounts to the SMS sign-in", () => {
    renderWithProviders(<ForgotPasswordPageClient />);

    expect(screen.getByLabelText("Adresse email")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Téléphone/ })).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Numéro de téléphone")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Se connecter par SMS" })).toHaveAttribute("href", "/login");
  });
});

describe("passwordPolicyError — the backend policy", () => {
  it("requires eight characters, a letter and a digit", () => {
    expect(passwordPolicyError("abc1")).toMatch(/8 caractères/);
    expect(passwordPolicyError("12345678")).toMatch(/lettre/);
    expect(passwordPolicyError("abcdefgh")).toMatch(/chiffre/);
    expect(passwordPolicyError("motdepasse7")).toBeNull();
    expect(passwordPolicyError("Éléphant9")).toBeNull();
  });
});
