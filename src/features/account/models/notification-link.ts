/**
 * Where a notification leads on this site.
 *
 * The backend writes one `action_url` for every app (`/orders/{id}`,
 * `/support/chat/{id}`, `/wallet`, `/deliveries/{id}`, `/admin/...`). Most of
 * them are no page of this site: such a link opened a 404. Each one is
 * mapped to the page that shows it here, and one with no page here is
 * dropped — the notification is then shown without a link.
 */

const ULID = /^[0-9A-Za-z]{26}$/;

/** Pages of this site a notification may lead to as they are. */
const SITE_PAGES = new Set([
  "/",
  "/account",
  "/account/orders",
  "/account/notifications",
  "/account/wishlist",
  "/account/addresses",
  "/account/coupons",
  "/cart",
  "/help",
  "/messages",
  "/support-chat",
]);

export function resolveNotificationLink(actionUrl: string | null | undefined): string | null {
  const url = actionUrl?.trim();
  // A path of this site only: never another site, never a protocol-relative URL
  if (!url || !url.startsWith("/") || url.startsWith("//")) return null;

  const path = url.split(/[?#]/)[0].replace(/\/+$/, "") || "/";
  const [, first, id, ...rest] = path.split("/");

  if (first === "orders" && id && ULID.test(id) && rest.length === 0) {
    return `/track-order?id=${id}`;
  }
  if (first === "messages" && id && ULID.test(id) && rest.length === 0) {
    return `/messages/${id}`;
  }
  if (first === "support" && id === "chat") {
    return "/support-chat";
  }
  return SITE_PAGES.has(path) ? path : null;
}

/**
 * The groups of a further page added to those already shown: the day the
 * previous page ended on is continued, never shown twice, and a notification
 * already listed is not repeated.
 */
export function appendNotificationGroups<T extends { id: string }>(
  shown: Array<{ label: string; items: T[] }>,
  next: Array<{ label: string; items: T[] }>,
): Array<{ label: string; items: T[] }> {
  const seen = new Set(shown.flatMap((g) => g.items.map((i) => i.id)));
  const merged = shown.map((g) => ({ ...g, items: [...g.items] }));
  for (const group of next) {
    const items = group.items.filter((i) => !seen.has(i.id));
    items.forEach((i) => seen.add(i.id));
    if (items.length === 0) continue;
    const last = merged[merged.length - 1];
    if (last && last.label === group.label) {
      last.items.push(...items);
    } else {
      merged.push({ ...group, items });
    }
  }
  return merged;
}
