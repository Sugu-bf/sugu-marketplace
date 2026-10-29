/**
 * Where the Meta Pixel may send an event, and with which address.
 *
 * The pixel sends the full address of the page with every event. Pages of a
 * checkout, a payment, an account, an order or an invoice carry ids and
 * tokens in their path or query (`/checkout?session=…`, `/invoices/{token}`,
 * `/track-order?id=…`): no event ever leaves from them. Anywhere else, an
 * address whose query holds anything but campaign parameters is not sent
 * either: the query of a page is never told to Meta.
 */

const PRIVATE_PATH_PREFIXES = [
  "/checkout",
  "/payments",
  "/account",
  "/track-order",
  "/invoices",
  "/messages",
  "/support-chat",
] as const;

/** Campaign parameters an ad link adds: what the pixel exists to read. */
const CAMPAIGN_PARAM = /^(utm_[a-z_]+|fbclid)$/;

export function isPrivatePath(pathname: string): boolean {
  return PRIVATE_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function canTrackPage(pathname: string, search: string): boolean {
  if (isPrivatePath(pathname)) return false;
  const params = new URLSearchParams(search);
  for (const key of params.keys()) {
    if (!CAMPAIGN_PARAM.test(key)) return false;
  }
  return true;
}
