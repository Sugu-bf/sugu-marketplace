// @vitest-environment jsdom
/**
 * Account identity (audit 2026-10-29).
 *
 * P0-12 — the profile form wrote any phone number on the account. A new number
 *         is now confirmed with the code sent to it, in its own dialog; the
 *         profile form only sends the name.
 * P1-28 — an account without a password confirms its deletion with a code,
 *         and the session cookie goes with the account.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw/server";
import { setupMswServer } from "@/test/msw/setup";
import { API_BASE_URL } from "@/lib/api/config";
import { renderWithProviders, screen, fireEvent, waitFor } from "@/test/render";
import { PersonalInfoCard } from "../components/PersonalInfoCard";
import { DataPrivacyCard } from "../components/DataPrivacyCard";
import type { UserProfile } from "../api/account.types";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh, push: vi.fn() }),
}));

setupMswServer();

// jsdom has no <dialog> behaviour; the Modal component opens one.
HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
  this.open = true;
};
HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
  this.open = false;
};

const ACCOUNT = `${API_BASE_URL}/api/v1/marketplace/account`;

const profile: UserProfile = {
  id: "01jkqz3m5baxnp9c7hd2fewyr4",
  name: "Moussa",
  email: null,
  emailVerified: false,
  phoneE164: "+22670300001",
  phoneVerified: true,
  avatarUrl: null,
  userType: "buyer",
  referralCode: null,
  createdAt: "2026-01-10T10:00:00Z",
};

function typeCode(code: string) {
  code.split("").forEach((digit, i) => {
    fireEvent.change(screen.getByLabelText(`Chiffre ${i + 1}`), { target: { value: digit } });
  });
}

afterEach(() => {
  refresh.mockClear();
});

describe("PersonalInfoCard — the phone number", () => {
  it("never sends a phone number with the profile form", async () => {
    const bodies: unknown[] = [];
    server.use(
      http.patch(`${ACCOUNT}/profile`, async ({ request }) => {
        bodies.push(await request.json());
        return HttpResponse.json({ success: true, message: "ok" });
      }),
    );
    renderWithProviders(<PersonalInfoCard profile={profile} />);

    fireEvent.click(screen.getByRole("button", { name: /Modifier/ }));
    expect(screen.queryByLabelText("Téléphone")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    await waitFor(() => expect(bodies).toEqual([{ name: "Moussa" }]));
  });

  it("changes the number only with the code sent to the new one", async () => {
    const calls: Array<{ url: string; body: unknown }> = [];
    server.use(
      http.post(`${ACCOUNT}/phone/code`, async ({ request }) => {
        calls.push({ url: "code", body: await request.json() });
        return HttpResponse.json({ success: true, message: "ok", data: { expires_in: 300, cooldown_seconds: 60 } });
      }),
      http.post(`${ACCOUNT}/phone`, async ({ request }) => {
        calls.push({ url: "confirm", body: await request.json() });
        return HttpResponse.json({ success: true, message: "ok" });
      }),
    );
    renderWithProviders(<PersonalInfoCard profile={profile} />);

    fireEvent.click(screen.getByRole("button", { name: "Changer de numéro" }));
    fireEvent.change(screen.getByLabelText("Nouveau numéro"), { target: { value: "+226 70 30 00 02" } });
    fireEvent.click(screen.getByRole("button", { name: "Recevoir le code" }));

    expect(await screen.findByText("+22670300002")).toBeInTheDocument();
    typeCode("424242");

    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(calls).toEqual([
      { url: "code", body: { phone_e164: "+22670300002" } },
      { url: "confirm", body: { phone_e164: "+22670300002", code: "424242" } },
    ]);
  });

  it("says when the number cannot be used", async () => {
    server.use(
      http.post(`${ACCOUNT}/phone/code`, () =>
        HttpResponse.json({ success: true, message: "ok", data: { expires_in: 300 } }),
      ),
      http.post(`${ACCOUNT}/phone`, () =>
        HttpResponse.json(
          { success: false, message: "Ce numéro ne peut pas être associé à votre compte.", error_code: "ACCOUNT_PHONE_UNAVAILABLE" },
          { status: 422 },
        ),
      ),
    );
    renderWithProviders(<PersonalInfoCard profile={profile} />);

    fireEvent.click(screen.getByRole("button", { name: "Changer de numéro" }));
    fireEvent.change(screen.getByLabelText("Nouveau numéro"), { target: { value: "+22670300009" } });
    fireEvent.click(screen.getByRole("button", { name: "Recevoir le code" }));
    await screen.findByText("+22670300009");
    typeCode("424242");

    expect(await screen.findByText("Ce numéro ne peut pas être associé à votre compte.")).toBeInTheDocument();
    expect(refresh).not.toHaveBeenCalled();
  });
});

describe("DataPrivacyCard — an account without a password", () => {
  it("deletes the account with the code received, then drops the session cookie", async () => {
    const assign = vi.fn();
    vi.stubGlobal("location", { ...window.location, assign });
    const deletions: unknown[] = [];
    let sessionCleared = false;
    server.use(
      http.post(`${ACCOUNT}/deletion-code`, () =>
        HttpResponse.json({
          success: true,
          message: "ok",
          data: { channel: "sms", destination: "+226 •• •• 01", expires_in: 300, cooldown_seconds: 60 },
        }),
      ),
      http.delete(ACCOUNT, async ({ request }) => {
        deletions.push(await request.json());
        return HttpResponse.json({ success: true, message: "Compte supprimé avec succès." });
      }),
      http.delete("*/api/auth/set-session", () => {
        sessionCleared = true;
        return HttpResponse.json({ success: true });
      }),
    );
    renderWithProviders(<DataPrivacyCard hasPassword={false} />);

    fireEvent.click(screen.getByRole("button", { name: /Supprimer/ }));
    expect(screen.queryByLabelText("Mot de passe")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Recevoir le code" }));
    expect(await screen.findByText("+226 •• •• 01")).toBeInTheDocument();
    typeCode("424242");

    await waitFor(() => expect(assign).toHaveBeenCalledWith("/"));
    expect(deletions).toEqual([{ code: "424242" }]);
    expect(sessionCleared).toBe(true);
    vi.unstubAllGlobals();
  });

  it("still asks the password of an account that has one", () => {
    renderWithProviders(<DataPrivacyCard hasPassword />);

    fireEvent.click(screen.getByRole("button", { name: /Supprimer/ }));

    expect(screen.getByLabelText("Mot de passe")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Recevoir le code" })).not.toBeInTheDocument();
  });
});
