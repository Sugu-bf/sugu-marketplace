// @vitest-environment jsdom
/**
 * The « Non lus » tab asks the server for the conversations holding an
 * unread message (`unread=1`); it used to send `status=unread`, which the
 * server ignored, so the tab listed everything. Both tabs show the server's
 * counts, and the rows loaded when an older answer has none.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw/server";
import { setupMswServer } from "@/test/msw/setup";
import { API_BASE_URL } from "@/lib/api/config";
import { renderWithProviders, screen, fireEvent, waitFor } from "@/test/render";
import { ConversationList } from "../components/ConversationList";

setupMswServer();

const LIST_URL = `${API_BASE_URL}/api/v1/me/conversations`;

function row(id: string, unread: number) {
  return {
    id,
    type: "general",
    status: "open",
    store: { id: "s1", name: `Boutique ${id.slice(-2)}`, slug: "b", logo_url: null, is_online: false },
    order_id: null,
    last_message: null,
    unread_count: unread,
    updated_at: "2026-10-29T10:00:00Z",
    created_at: "2026-10-29T10:00:00Z",
    participants: [],
  };
}

/** Answers the list, records each query string. */
function serverListing(counts?: { all: number; unread: number }) {
  const queries: URLSearchParams[] = [];
  server.use(
    http.get(LIST_URL, ({ request }) => {
      const params = new URL(request.url).searchParams;
      queries.push(params);
      const rows = params.get("unread") === "1"
        ? [row("01jkqz3m5baxnp9c7hd2fewyr1", 2)]
        : [row("01jkqz3m5baxnp9c7hd2fewyr1", 2), row("01jkqz3m5baxnp9c7hd2fewyr2", 0)];
      return HttpResponse.json({
        success: true,
        data: rows,
        meta: { has_more: false, next_cursor: null, ...(counts ? { counts } : {}) },
      });
    }),
  );
  return queries;
}

beforeEach(() => {
  vi.stubGlobal("IntersectionObserver", class {
    observe() {}
    disconnect() {}
  });
});

describe("ConversationList — unread tab", () => {
  it("asks the server for the unread conversations only", async () => {
    const queries = serverListing({ all: 41, unread: 7 });
    renderWithProviders(<ConversationList onSelectConversation={() => {}} activeConversationId={null} />);

    expect(await screen.findByText("Tous (41)")).toBeInTheDocument();
    expect(screen.getByText("Non lus (7)")).toBeInTheDocument();
    expect(queries[0]?.get("unread")).toBeNull();

    fireEvent.click(screen.getByText("Non lus (7)"));

    await waitFor(() => expect(queries.some((q) => q.get("unread") === "1")).toBe(true));
    expect(queries.every((q) => q.get("status") === null)).toBe(true);
    await waitFor(() => expect(screen.queryByText("Boutique r2")).toBeNull());
    expect(screen.getByText("Boutique r1")).toBeInTheDocument();
  });

  it("counts the rows loaded when the answer has no counts", async () => {
    serverListing();
    renderWithProviders(<ConversationList onSelectConversation={() => {}} activeConversationId={null} />);

    expect(await screen.findByText("Tous (2)")).toBeInTheDocument();
    expect(screen.getByText("Non lus (1)")).toBeInTheDocument();
  });
});
