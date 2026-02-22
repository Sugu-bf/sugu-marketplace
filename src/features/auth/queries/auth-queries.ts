import {
  mockCountryCodes,
  mockSocialProviders,
  mockVerificationEmail,
  mockVerificationPhone,
  type SocialProviderConfig,
} from "../mocks/auth";
import type { CountryCode } from "../models/auth";

/**
 * Query available country dial codes.
 * SSR-friendly — returns mock data.
 */
export async function queryCountryCodes(): Promise<CountryCode[]> {
  return mockCountryCodes;
}

/**
 * Query available social sign-in providers.
 */
export async function querySocialProviders(): Promise<SocialProviderConfig[]> {
  return mockSocialProviders;
}

/**
 * Query the default country code.
 */
export async function queryDefaultCountryCode(): Promise<CountryCode> {
  return mockCountryCodes[0]; // US by default
}

/**
 * Query mock verification destination (for design-only display).
 */
export async function queryVerificationDestination(
  method: "email" | "phone"
): Promise<string> {
  return method === "email" ? mockVerificationEmail : mockVerificationPhone;
}
