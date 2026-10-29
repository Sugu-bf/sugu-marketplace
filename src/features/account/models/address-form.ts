import { isApiError } from "@/lib/api";

/**
 * Rules of the address form: the phone of the recipient, and what the user
 * is told when the backend refuses the address.
 */

/** An account keeps at most this many addresses (the backend's own limit). */
export const MAX_ADDRESSES = 20;

export const ADDRESS_LIMIT_MESSAGE =
  `Vous avez atteint le nombre maximum de ${MAX_ADDRESSES} adresses. Supprimez-en une pour en ajouter une nouvelle.`;

const BURKINA_MESSAGE =
  "Numéro invalide : 8 chiffres pour le Burkina Faso, par exemple 70 12 34 56 ou +226 70 12 34 56.";
const INTERNATIONAL_MESSAGE =
  "Saisissez le numéro au format international, par exemple +225 07 12 34 56 78.";

export type AddressPhoneCheck = { ok: true; e164: string } | { ok: false; message: string };

/**
 * The phone of the recipient in E.164 (`+226XXXXXXXX` for Burkina Faso).
 *
 * Spaces, dashes, dots and brackets are ignored, `00` reads as `+`. For an
 * address in Burkina Faso, 8 digits alone, or `226` and 8 digits, are a
 * Burkina number. Elsewhere the number is asked with its country code.
 */
export function normalizeAddressPhone(raw: string, countryCode: string): AddressPhoneCheck {
  let phone = raw.replace(/[\s\-.()]/g, "");
  if (phone.startsWith("00")) phone = `+${phone.slice(2)}`;

  if (countryCode === "BF" && !phone.startsWith("+")) {
    if (/^\d{8}$/.test(phone)) phone = `+226${phone}`;
    else if (/^226\d{8}$/.test(phone)) phone = `+${phone}`;
  }

  if (phone.startsWith("+226")) {
    return /^\+226\d{8}$/.test(phone) ? { ok: true, e164: phone } : { ok: false, message: BURKINA_MESSAGE };
  }
  if (/^\+[1-9]\d{7,14}$/.test(phone)) return { ok: true, e164: phone };
  return { ok: false, message: countryCode === "BF" ? BURKINA_MESSAGE : INTERNATIONAL_MESSAGE };
}

/**
 * What the user reads when saving an address fails: the reasons the backend
 * gives for a refused address (its fields, or its limit of addresses), our
 * words for anything else.
 */
export function addressSaveErrorMessage(err: unknown): string {
  if (isApiError(err) && err.status === 422) {
    const fields = err.details?.errors as Record<string, string[]> | undefined;
    const reasons = fields ? Object.values(fields).flat().filter(Boolean) : [];
    if (reasons.length > 0) return reasons.join(" ");
    if (/maximum d'adresses/i.test(err.message)) return ADDRESS_LIMIT_MESSAGE;
    if (err.message) return err.message;
  }
  if (isApiError(err) && (err.code === "NETWORK_ERROR" || err.code === "TIMEOUT")) {
    return "Erreur réseau. Vérifiez votre connexion et réessayez.";
  }
  return "L'adresse n'a pas pu être enregistrée. Réessayez dans un instant.";
}
