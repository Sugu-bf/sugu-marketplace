// @vitest-environment jsdom
/**
 * A row of the list names the other side — the store, else the courier —
 * never the buyer's own name. A last message hidden by moderation is not
 * previewed.
 */
import { describe, expect, it } from "vitest";
import { render, screen } from "@/test/render";
import { ConversationCard } from "../components/ConversationCard";
import type { Conversation } from "@/lib/messaging/types";

function conversation(overrides: Partial<Conversation> = {}): Conversation {
  return {
    id: "01jkqz3m5baxnp9c7hd2fewyr4",
    type: "general",
    status: "open",
    store: { id: "s1", name: "Boutique Faso", slug: "faso", logo_url: null, is_online: false },
    order_id: null,
    last_message: null,
    unread_count: 0,
    updated_at: "2026-10-29T10:00:00Z",
    created_at: "2026-10-29T10:00:00Z",
    participants: [],
    ...overrides,
  };
}

describe("ConversationCard", () => {
  it("names the courier of a delivery conversation, not the buyer", () => {
    render(
      <ConversationCard
        conversation={conversation({
          type: "courier_customer",
          store: null,
          participants: [
            { id: "u1", type: "customer", role: "customer", name: "Awa Ouédraogo" },
            { id: "c1", type: "courier", role: "courier", name: "Issa Livreur" },
          ],
        })}
        isActive={false}
        onClick={() => {}}
      />,
    );

    expect(screen.getByText("Issa Livreur")).toBeInTheDocument();
    expect(screen.queryByText("Awa Ouédraogo")).toBeNull();
  });

  it("does not preview a last message hidden by moderation", () => {
    render(
      <ConversationCard
        conversation={conversation({
          last_message: { id: "m1", body: "", sender_type: "seller", is_hidden: true, created_at: "2026-10-29T10:01:00Z" },
        })}
        isActive={false}
        onClick={() => {}}
      />,
    );

    expect(screen.getByText("Message retiré par la modération")).toBeInTheDocument();
  });

  it("previews a visible last message", () => {
    render(
      <ConversationCard
        conversation={conversation({
          last_message: { id: "m1", body: "Il reste du stock ?", sender_type: "seller", is_hidden: false, created_at: "2026-10-29T10:01:00Z" },
        })}
        isActive={false}
        onClick={() => {}}
      />,
    );

    expect(screen.getByText("Il reste du stock ?")).toBeInTheDocument();
  });
});
