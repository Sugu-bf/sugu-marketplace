// @vitest-environment jsdom
/**
 * The notifications page showed the first 20 notifications and no more, and
 * their links led to pages of the other apps (`/orders/{id}`, `/wallet`,
 * `/deliveries/{id}`…) that are a 404 on this site. Further pages now load
 * on « Charger plus », and each link leads to the page of this site that
 * shows it, or to nothing.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders, screen, fireEvent, waitFor } from "@/test/render";

const { getMock } = vi.hoisted(() => ({ getMock: vi.fn() }));

vi.mock("@/lib/api", async () => ({
  ...(await vi.importActual<typeof import("@/lib/api")>("@/lib/api")),
  api: { get: getMock, post: vi.fn() },
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

import { NotificationsClient } from "../components/NotificationsClient";
import { fetchNotifications } from "../api/account.api";
import { appendNotificationGroups, resolveNotificationLink } from "../models/notification-link";

const ORDER = "01jkqz3m5baxnp9c7hd2fewyr4";

const item = (id: string, title: string, action_url: string | null = null) => ({
  id,
  type: "order_status_changed",
  title,
  body: `${title} — détail`,
  action_url,
  is_read: true,
  time: "2026-10-21T10:00:00Z",
});

const page = (groups: Array<{ label: string; items: unknown[] }>, next_cursor: string | null) => ({
  data: { success: true, data: { groups, next_cursor, has_more: next_cursor !== null, unread_count: 0 } },
});

beforeEach(() => {
  getMock.mockReset();
});

describe("resolveNotificationLink", () => {
  it.each([
    [`/orders/${ORDER}`, `/track-order?id=${ORDER}`],
    [`/messages/${ORDER}`, `/messages/${ORDER}`],
    [`/support/chat/${ORDER}`, "/support-chat"],
    ["/", "/"],
    ["/account/orders/", "/account/orders"],
  ])("leads %s to %s", (actionUrl, link) => {
    expect(resolveNotificationLink(actionUrl)).toBe(link);
  });

  it.each([
    "/wallet",
    "/inventory",
    "/promotions",
    `/deliveries/${ORDER}`,
    `/shipments/${ORDER}`,
    `/seller/orders/${ORDER}`,
    `/vendor/messages/${ORDER}`,
    `/admin/support/tickets/${ORDER}`,
    "/orders/not-an-id",
    "https://evil.example/phish",
    "//evil.example/phish",
    "javascript:alert(1)",
    null,
    "",
  ])("drops %s, which is no page of this site", (actionUrl) => {
    expect(resolveNotificationLink(actionUrl)).toBeNull();
  });
});

describe("appendNotificationGroups", () => {
  it("continues the day the previous page ended on, without repeating a notification", () => {
    const merged = appendNotificationGroups(
      [{ label: "Hier", items: [{ id: "a" }, { id: "b" }] }],
      [
        { label: "Hier", items: [{ id: "b" }, { id: "c" }] },
        { label: "07 mars 2026", items: [{ id: "d" }] },
      ],
    );
    expect(merged).toEqual([
      { label: "Hier", items: [{ id: "a" }, { id: "b" }, { id: "c" }] },
      { label: "07 mars 2026", items: [{ id: "d" }] },
    ]);
  });
});

describe("notifications page", () => {
  it("maps the link of each notification when it reads them", async () => {
    getMock.mockResolvedValue(page([{ label: "Hier", items: [item("n1", "Commande expédiée", `/orders/${ORDER}`), item("n2", "Wallet", "/wallet")] }], null));

    const data = await fetchNotifications();

    expect(data.groups[0].items.map((i) => i.actionUrl)).toEqual([`/track-order?id=${ORDER}`, null]);
  });

  it("loads the next page on « Charger plus », until there is no more", async () => {
    getMock.mockResolvedValueOnce(page([{ label: "Hier", items: [item("n1", "Première")] }], "cursor-2"));
    const first = await fetchNotifications();
    getMock.mockResolvedValueOnce(
      page([{ label: "Hier", items: [item("n2", "Deuxième")] }, { label: "07 mars 2026", items: [item("n3", "Troisième", `/orders/${ORDER}`)] }], null),
    );

    renderWithProviders(<NotificationsClient initialData={first} />);
    fireEvent.click(screen.getByRole("button", { name: "Charger plus" }));

    expect(await screen.findByText("Troisième")).toBeInTheDocument();
    expect(new URL(getMock.mock.calls[1][0] as string).searchParams.get("cursor")).toBe("cursor-2");
    expect(screen.getAllByText("Hier")).toHaveLength(1);
    expect(screen.getByText("Deuxième")).toBeInTheDocument();
    expect(screen.getByText("Troisième").closest("a")).toHaveAttribute("href", `/track-order?id=${ORDER}`);
    await waitFor(() => expect(screen.queryByRole("button", { name: "Charger plus" })).toBeNull());
  });

  it("says when the next page could not load, and lets the user try again", async () => {
    getMock.mockResolvedValueOnce(page([{ label: "Hier", items: [item("n1", "Première")] }], "cursor-2"));
    const first = await fetchNotifications();
    getMock.mockRejectedValueOnce(new Error("network"));

    renderWithProviders(<NotificationsClient initialData={first} />);
    fireEvent.click(screen.getByRole("button", { name: "Charger plus" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("n'ont pas pu être chargées");
    expect(screen.getByRole("button", { name: "Charger plus" })).toBeEnabled();
  });

  it("offers no « Charger plus » when everything is shown", () => {
    renderWithProviders(
      <NotificationsClient initialData={{ groups: [], nextCursor: null, hasMore: false, unreadCount: 0 }} />,
    );

    expect(screen.queryByRole("button", { name: "Charger plus" })).toBeNull();
  });
});
