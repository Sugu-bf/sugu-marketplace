// @vitest-environment jsdom
/**
 * The phone of an address is checked and saved in E.164 (`+226XXXXXXXX` for
 * Burkina Faso, however it is typed), and a refused address says why: the
 * backend's reasons, or its limit of 20 addresses — never a raw API error.
 */
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders, screen, fireEvent, waitFor } from "@/test/render";
import { ApiError } from "@/lib/api/errors";

const { postMock } = vi.hoisted(() => ({ postMock: vi.fn() }));

vi.mock("@/lib/api", async () => ({
  ...(await vi.importActual<typeof import("@/lib/api")>("@/lib/api")),
  api: { get: vi.fn(), post: postMock, put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

import { AddressListClient } from "../components/AddressListClient";
import { addressSaveErrorMessage, normalizeAddressPhone } from "../models/address-form";
import type { Address } from "../api/account.types";

describe("normalizeAddressPhone", () => {
  it.each([
    ["70123456", "BF", "+22670123456"],
    ["70 12 34 56", "BF", "+22670123456"],
    ["+226 70 12 34 56", "BF", "+22670123456"],
    ["00226-70-12-34-56", "BF", "+22670123456"],
    ["22670123456", "BF", "+22670123456"],
    ["+225 07 12 34 56 78", "CI", "+2250712345678"],
    ["+226 70 12 34 56", "CI", "+22670123456"],
  ])("reads %s (%s) as %s", (raw, country, e164) => {
    expect(normalizeAddressPhone(raw, country)).toEqual({ ok: true, e164 });
  });

  it.each([
    ["7012345", "BF"],
    ["701234567", "BF"],
    ["+226 70 12 34 5", "BF"],
    ["+22670123456789", "BF"],
    ["abc", "BF"],
    ["0712345678", "CI"],
    ["+12", "CI"],
  ])("refuses %s (%s)", (raw, country) => {
    expect(normalizeAddressPhone(raw, country).ok).toBe(false);
  });
});

describe("addressSaveErrorMessage", () => {
  it("gives the reasons of a refused field", () => {
    const err = new ApiError({
      status: 422,
      code: "VALIDATION_ERROR",
      message: "The given data was invalid.",
      details: { errors: { phone: ["Le téléphone ne doit pas dépasser 20 caractères."] } },
    });
    expect(addressSaveErrorMessage(err)).toBe("Le téléphone ne doit pas dépasser 20 caractères.");
  });

  it("explains the limit of addresses", () => {
    const err = new ApiError({
      status: 422,
      code: "VALIDATION_ERROR",
      message: "Vous avez atteint le nombre maximum d'adresses (20).",
    });
    expect(addressSaveErrorMessage(err)).toMatch(/maximum de 20 adresses\. Supprimez-en une/);
  });

  it("never shows a raw server error", () => {
    const err = new ApiError({ status: 500, code: "SERVER_ERROR", message: "Erreur API 500: Internal Server Error" });
    expect(addressSaveErrorMessage(err)).toBe("L'adresse n'a pas pu être enregistrée. Réessayez dans un instant.");
  });
});

function address(i: number): Address {
  return {
    id: `01jkqz3m5baxnp9c7hd2fewa${String(i).padStart(2, "0")}`,
    label: "Domicile",
    fullName: "Awa",
    phone: "+22670123456",
    addressLine: "Rue 1",
    addressComplement: null,
    city: "Ouagadougou",
    zone: "Gounghin",
    state: null,
    countryCode: "BF",
    latitude: null,
    longitude: null,
    isDefault: i === 0,
    isVerified: false,
  };
}

function fillAndSubmit(phone: string) {
  // Text queries: role queries are slow on a list of 20 addresses
  fireEvent.click(screen.getAllByText(/Ajouter une adresse/, { selector: "button" })[0]);
  fireEvent.change(screen.getByLabelText("Nom complet"), { target: { value: "Awa Ouédraogo" } });
  fireEvent.change(screen.getByLabelText("Téléphone"), { target: { value: phone } });
  fireEvent.change(screen.getByLabelText("Ville"), { target: { value: "Ouagadougou" } });
  fireEvent.change(screen.getByLabelText("Quartier / Secteur"), { target: { value: "Gounghin" } });
  fireEvent.click(screen.getByText("Ajouter", { selector: "button" }));
}

const SAVED = {
  success: true,
  data: {
    id: "01jkqz3m5baxnp9c7hd2fewa99",
    label: "Domicile",
    full_name: "Awa Ouédraogo",
    phone: "+22670123456",
    address_line: "Gounghin",
    address_complement: null,
    city: "Ouagadougou",
    zone: "Gounghin",
    state: null,
    country_code: "BF",
    is_default: true,
    is_verified: false,
  },
};

describe("address form", { timeout: 20_000 }, () => {
  beforeAll(() => {
    // jsdom has no modal dialog: open it as the browser does
    HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) {
      this.open = true;
    };
    HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) {
      this.open = false;
    };
  });

  beforeEach(() => {
    postMock.mockReset();
  });

  it("saves a Burkina number typed with spaces as +226XXXXXXXX", async () => {
    postMock.mockResolvedValue({ data: SAVED });
    renderWithProviders(<AddressListClient initialAddresses={[]} />);

    fillAndSubmit("70 12 34 56");

    await waitFor(() => expect(postMock).toHaveBeenCalled());
    expect(postMock.mock.calls[0][1].body).toMatchObject({ phone: "+22670123456", country_code: "BF" });
  });

  it("refuses a number that is not one, without asking the backend", () => {
    renderWithProviders(<AddressListClient initialAddresses={[]} />);

    fillAndSubmit("70 12 34");

    expect(screen.getByText(/Numéro invalide : 8 chiffres pour le Burkina Faso/)).toBeInTheDocument();
    expect(postMock).not.toHaveBeenCalled();
  });

  it("says the backend's reason when it refuses the address", async () => {
    postMock.mockRejectedValue(
      new ApiError({ status: 422, code: "VALIDATION_ERROR", message: "Vous avez atteint le nombre maximum d'adresses (20)." }),
    );
    renderWithProviders(<AddressListClient initialAddresses={[address(0)]} />);

    fillAndSubmit("70123456");

    expect(await screen.findByText(/maximum de 20 adresses/)).toBeInTheDocument();
  });

  it("tells the limit of 20 addresses before asking the backend", () => {
    renderWithProviders(<AddressListClient initialAddresses={Array.from({ length: 20 }, (_, i) => address(i))} />);

    fillAndSubmit("70123456");

    expect(screen.getByText(/maximum de 20 adresses/)).toBeInTheDocument();
    expect(postMock).not.toHaveBeenCalled();
  });
});
