/**
 * The visitor's address, handed to Laravel in a form it can trust (audit P1-3).
 *
 * Laravel sees every server-side call of this app (SSR, BFF, proxy) coming
 * from this server: without the visitor's address, its per-address limits
 * (sign-in, OTP, public catalogue) are shared by every visitor. Relaying the
 * x-forwarded-for chain as is would let any visitor name the address of their
 * choice. So:
 *
 * 1. The address is read from x-forwarded-for the way Laravel reads it: from
 *    the right, skipping the proxies this deployment trusts (Cloudflare's
 *    ranges by default, TRUSTED_PROXIES / TRUSTED_PROXIES_EXTRA as in
 *    Laravel). The first untrusted entry is the visitor; entries further left
 *    were written by the visitor and are never read. This app must only be
 *    reachable through the platform's reverse proxy, which appends the address
 *    of whoever connected to it.
 * 2. It is sent as X-Sugu-Client-IP with a timestamp and an HMAC-SHA256 of
 *    "<ip>|<ts>" under SUGU_EDGE_SECRET, a secret shared with Laravel only
 *    (never NEXT_PUBLIC). Laravel's TrustSuguEdgeClientIp middleware uses the
 *    address for the request when the signature is valid and fresh (±60 s),
 *    and ignores the headers otherwise.
 *
 * Fails closed: no secret (or one under 32 characters), no readable address
 * → no header at all, and Laravel keeps its own view of the caller.
 *
 * Plain Web Crypto and string parsing: the API client, which is also bundled
 * for the browser, reaches this module (it only runs it on the server).
 */

export const CLIENT_IP_HEADER = "X-Sugu-Client-IP";
export const CLIENT_IP_TS_HEADER = "X-Sugu-Client-IP-Ts";
export const CLIENT_IP_SIG_HEADER = "X-Sugu-Client-IP-Sig";

const MIN_SECRET_LENGTH = 32;

/** Cloudflare's published ranges (https://www.cloudflare.com/ips/), as Laravel's default. */
const CLOUDFLARE_RANGES = [
  "173.245.48.0/20", "103.21.244.0/22", "103.22.200.0/22", "103.31.4.0/22",
  "141.101.64.0/18", "108.162.192.0/18", "190.93.240.0/20", "188.114.96.0/20",
  "197.234.240.0/22", "198.41.128.0/17", "162.158.0.0/15", "104.16.0.0/13",
  "104.24.0.0/14", "172.64.0.0/13", "131.0.72.0/22",
  "2400:cb00::/32", "2606:4700::/32", "2803:f800::/32", "2405:b500::/32",
  "2405:8100::/32", "2a06:98c0::/29", "2c0f:f248::/32",
];

type Env = Record<string, string | undefined>;

interface ParsedIp {
  bits: 32 | 128;
  value: bigint;
}

interface Range extends ParsedIp {
  prefix: number;
}

function parseIpv4(text: string): bigint | null {
  const parts = text.split(".");
  if (parts.length !== 4) return null;
  let value = BigInt(0);
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part) || Number(part) > 255 || (part.length > 1 && part[0] === "0")) {
      return null;
    }
    value = (value << BigInt(8)) + BigInt(Number(part));
  }
  return value;
}

function parseIpv6(text: string): bigint | null {
  if (!/^[0-9a-f:.]+$/i.test(text) || text.split("::").length > 2) return null;

  let tail = text;
  const groups: number[] = [];
  const dotted = /^(.*:)(\d+\.\d+\.\d+\.\d+)$/.exec(text);
  if (dotted) {
    const v4 = parseIpv4(dotted[2]);
    if (v4 === null) return null;
    tail = `${dotted[1]}${(v4 >> BigInt(16)).toString(16)}:${(v4 & BigInt(0xffff)).toString(16)}`;
  }

  const [head, rest] = tail.split("::");
  const read = (part: string | undefined) =>
    part ? part.split(":").map((group) => (/^[0-9a-f]{1,4}$/i.test(group) ? parseInt(group, 16) : NaN)) : [];
  const left = read(head);
  const right = read(rest);
  if ([...left, ...right].some(Number.isNaN)) return null;

  if (rest === undefined) {
    if (left.length !== 8) return null;
    groups.push(...left);
  } else {
    const missing = 8 - left.length - right.length;
    if (missing < 1) return null;
    groups.push(...left, ...new Array<number>(missing).fill(0), ...right);
  }

  return groups.reduce((value, group) => (value << BigInt(16)) + BigInt(group), BigInt(0));
}

function parseIp(text: string): ParsedIp | null {
  const v4 = parseIpv4(text);
  if (v4 !== null) return { bits: 32, value: v4 };
  const v6 = parseIpv6(text);
  return v6 === null ? null : { bits: 128, value: v6 };
}

/** "1.2.3.4", "1.2.3.4:5678", "[2001:db8::1]:443", "::ffff:1.2.3.4" → the bare address. */
export function normalizeIp(entry: string): string | null {
  let value = entry.trim();
  const bracketed = /^\[([^\]]+)\](?::\d+)?$/.exec(value);
  if (bracketed) value = bracketed[1];
  else if (/^\d{1,3}(\.\d{1,3}){3}:\d+$/.test(value)) value = value.slice(0, value.lastIndexOf(":"));

  const mapped = /^::ffff:(\d{1,3}(\.\d{1,3}){3})$/i.exec(value);
  if (mapped) value = mapped[1];

  return parseIp(value) ? value.toLowerCase() : null;
}

function parseRange(text: string): Range | null {
  const [address, prefixText] = text.trim().split("/");
  const ip = parseIp(address);
  if (!ip) return null;
  if (prefixText === undefined) return { ...ip, prefix: ip.bits };
  const prefix = Number(prefixText);
  if (!/^\d{1,3}$/.test(prefixText) || prefix > ip.bits) return null;
  return { ...ip, prefix };
}

function inRange(ip: ParsedIp, range: Range): boolean {
  if (ip.bits !== range.bits) return false;
  const shift = BigInt(range.bits - range.prefix);
  return ip.value >> shift === range.value >> shift;
}

/** The proxies whose x-forwarded-for entries are skipped, configured as in Laravel. */
export function trustedProxies(env: Env = process.env): Range[] {
  const base = env.TRUSTED_PROXIES?.trim() ? env.TRUSTED_PROXIES.split(",") : CLOUDFLARE_RANGES;
  const extra = env.TRUSTED_PROXIES_EXTRA?.trim() ?? "";
  return [...base, ...(extra && extra !== "*" ? extra.split(",") : [])]
    .map(parseRange)
    .filter((range): range is Range => range !== null);
}

/** The visitor's address in an x-forwarded-for chain, or null when none can be told. */
export function clientIpFromForwardedFor(chain: string | null, trusted: Range[]): string | null {
  if (!chain) return null;
  const entries = chain.split(",");

  for (let index = entries.length - 1; index >= 0; index--) {
    const ip = normalizeIp(entries[index]);
    // An unreadable hop: nothing to its left can be vouched for.
    if (!ip) return null;
    const parsed = parseIp(ip)!;
    if (!trusted.some((range) => inRange(parsed, range))) return ip;
  }
  return null;
}

export async function signClientIp(ip: string, timestamp: number, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(`${ip}|${timestamp}`));
  return Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/**
 * The signed address headers for a call to Laravel made on behalf of the
 * request whose headers are given. Empty when they cannot be produced.
 */
export async function clientIpHeaders(
  requestHeaders: Pick<Headers, "get">,
  env: Env = process.env,
  now: number = Date.now(),
): Promise<Record<string, string>> {
  const secret = env.SUGU_EDGE_SECRET ?? "";
  if (secret.length < MIN_SECRET_LENGTH) return {};

  const ip = clientIpFromForwardedFor(requestHeaders.get("x-forwarded-for"), trustedProxies(env));
  if (!ip) return {};

  const timestamp = Math.floor(now / 1000);
  return {
    [CLIENT_IP_HEADER]: ip,
    [CLIENT_IP_TS_HEADER]: String(timestamp),
    [CLIENT_IP_SIG_HEADER]: await signClientIp(ip, timestamp, secret),
  };
}
