/**
 * Group buying — URL builders. `v1Url` adds `/api/v1/` and the API base; in
 * the browser the client sends credentialed calls through the BFF.
 */
import { v1Url, type QueryParams } from "@/lib/api/endpoints";

const BASE = "/group-buys";

/** The 8-character group code, as the API accepts it (no I, O, 0 or 1). */
export const GROUP_CODE_PATTERN = /^[2-9A-HJ-NP-Z]{8}$/;

export function normalizeGroupCode(code: string): string | null {
  const normalized = code.trim().toUpperCase();
  return GROUP_CODE_PATTERN.test(normalized) ? normalized : null;
}

export const groupBuysUrl = (params?: QueryParams): string => v1Url(BASE, params);
export const groupBuyStatsUrl = (): string => v1Url(`${BASE}/stats`);
export const groupBuyOfferUrl = (params: QueryParams): string => v1Url(`${BASE}/offer`, params);
export const groupBuyUrl = (code: string): string => v1Url(`${BASE}/${code}`);
export const createGroupBuyUrl = (): string => v1Url(BASE);
export const joinGroupBuyUrl = (code: string): string => v1Url(`${BASE}/${code}/join`);
export const groupBuyMembershipUrl = (code: string): string => v1Url(`${BASE}/${code}/membership`);
export const groupBuyCheckoutUrl = (code: string): string => v1Url(`${BASE}/${code}/checkout`);
export const relaunchGroupBuyUrl = (code: string): string => v1Url(`${BASE}/${code}/relaunch`);
export const myGroupBuysUrl = (params?: QueryParams): string => v1Url("/me/group-buys", params);
export const myGroupBuyStatsUrl = (): string => v1Url("/me/group-buys/stats");
