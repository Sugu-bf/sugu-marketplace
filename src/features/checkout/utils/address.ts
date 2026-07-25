/**
 * Traduction entre la forme canonique front (`Address`, camelCase) et le
 * vocabulaire de l'API checkout (`CheckoutAddress`, snake_case + line1/lat/lng).
 *
 * C'est le SEUL endroit du front où cette traduction a lieu — le pendant de
 * `App\Support\Address\AddressMapper` côté backend.
 */

import type { Address, AddressInput } from "@/features/account";
import type { CheckoutAddress } from "../api/checkout.types";

/** Identifiant local d'une adresse non encore persistée dans le carnet. */
export const DRAFT_ADDRESS_ID = "__draft__";

/**
 * Champs saisis dans la modale du checkout, avant persistance.
 * Volontairement minimal : c'est ce que l'acheteur tape réellement.
 */
export interface AddressDraft {
  label: string;
  fullName: string;
  phone: string;
  addressLine: string;
  addressComplement: string | null;
  city: string;
  zone: string | null;
  latitude: number | null;
  longitude: number | null;
}

/** Convertit une adresse du carnet en charge utile pour la session de checkout. */
export function addressToCheckoutPayload(address: Address): CheckoutAddress {
  return {
    full_name: address.fullName ?? "",
    phone: address.phone ?? "",
    line1: address.addressLine ?? "",
    line2: address.addressComplement,
    city: address.city,
    zone: address.zone,
    state: address.state,
    country_code: address.countryCode || "BF",
    lat: address.latitude,
    lng: address.longitude,
    address_id: address.id === DRAFT_ADDRESS_ID ? null : address.id,
  };
}

/** Convertit une saisie de modale en charge utile de création dans le carnet. */
export function draftToAddressInput(
  draft: AddressDraft,
  countryCode: string,
  isDefault: boolean
): AddressInput {
  return {
    label: draft.label,
    full_name: draft.fullName,
    phone: draft.phone,
    address_line: draft.addressLine,
    address_complement: draft.addressComplement,
    city: draft.city,
    zone: draft.zone,
    country_code: countryCode,
    is_default: isDefault,
    latitude: draft.latitude,
    longitude: draft.longitude,
  };
}

/**
 * Reconstruit une adresse affichable à partir du snapshot porté par la session.
 *
 * Sert au rechargement de page : le backend renvoie l'adresse déjà enregistrée
 * sur la session, mais elle ne correspond pas forcément à une entrée du carnet
 * (adresse saisie à la volée, ou carnet indisponible).
 */
export function checkoutAddressToAddress(snapshot: CheckoutAddress): Address {
  return {
    id: snapshot.address_id || DRAFT_ADDRESS_ID,
    label: "Livraison",
    fullName: snapshot.full_name || null,
    phone: snapshot.phone || null,
    addressLine: snapshot.line1 || null,
    addressComplement: snapshot.line2 ?? null,
    city: snapshot.city ?? "",
    zone: snapshot.zone ?? null,
    state: snapshot.state ?? null,
    countryCode: snapshot.country_code || "BF",
    latitude: snapshot.lat ?? null,
    longitude: snapshot.lng ?? null,
    isDefault: false,
    isVerified: false,
  };
}

/** Convertit une saisie de modale en adresse affichable non persistée. */
export function draftToAddress(
  draft: AddressDraft,
  countryCode: string
): Address {
  return {
    id: DRAFT_ADDRESS_ID,
    label: draft.label,
    fullName: draft.fullName,
    phone: draft.phone,
    addressLine: draft.addressLine,
    addressComplement: draft.addressComplement,
    city: draft.city,
    zone: draft.zone,
    state: null,
    countryCode,
    latitude: draft.latitude,
    longitude: draft.longitude,
    isDefault: false,
    isVerified: false,
  };
}

/** Rendu court d'une adresse pour l'affichage (quartier prioritaire). */
export function formatAddressLines(address: Address): string[] {
  const lines: string[] = [];

  if (address.addressLine) lines.push(address.addressLine);
  if (address.addressComplement) lines.push(address.addressComplement);

  const locality = [address.zone, address.city].filter(Boolean).join(", ");
  if (locality) lines.push(locality);

  return lines;
}
