// @vitest-environment jsdom
/**
 * A message's attachments are read through the relay, from their `path`:
 * images and files alike, never from an address the message would carry,
 * and nothing at all for a path that is not one of this message. When the
 * server masked contact details in the buyer's own message, a short note
 * says so under it.
 */
import { describe, expect, it } from "vitest";
import { renderWithProviders, screen, fireEvent, within } from "@/test/render";
import type { Message } from "@/lib/messaging/types";
import { MessageBubble } from "../components/MessageBubble";

const CONV = "01jkqz3m5baxnp9c7hd2fewyr4";
const MSG = "01jkqz3m5baxnp9c7hd2fewys1";
const path = (media: number, message = MSG) => `me/conversations/${CONV}/messages/${message}/attachments/${media}`;
const relay = (media: number) => `/api/backend/api/v1/${path(media)}`;

function message(overrides: Partial<Message> = {}): Message {
  return {
    id: MSG,
    sender_id: "01jkqz3m5baxnp9c7hd2fewyu1",
    sender_type: "customer",
    sender_name: "Awa Traoré",
    body: "Voici la photo",
    message_type: "image",
    metadata: null,
    is_own: true,
    attachments: [],
    is_flagged: false,
    created_at: "2026-10-21T10:00:00Z",
    ...overrides,
  };
}

describe("MessageBubble — attachments through the relay", () => {
  it("shows an image from its path, and opens it larger", () => {
    renderWithProviders(
      <MessageBubble
        message={message({
          attachments: [{ id: 42, type: "image", path: path(42), name: "colis.jpg", size: 2048, mime_type: "image/jpeg" }],
        })}
      />,
    );

    expect(screen.getByAltText("colis.jpg")).toHaveAttribute("src", relay(42));

    fireEvent.click(screen.getByRole("button", { name: "Agrandir colis.jpg" }));
    expect(screen.getByAltText("Image agrandie")).toHaveAttribute("src", relay(42));
  });

  it("links a file from its path", () => {
    renderWithProviders(
      <MessageBubble
        message={message({
          message_type: "text",
          attachments: [{ id: 43, type: "file", path: path(43), name: "facture.pdf", size: 4096, mime_type: "application/pdf" }],
        })}
      />,
    );

    const link = screen.getByRole("link", { name: "facture.pdf" });
    expect(link).toHaveAttribute("href", relay(43));
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("renders nothing for a path that is not one of this message, nor for an address", () => {
    renderWithProviders(
      <MessageBubble
        message={message({
          message_type: "text",
          attachments: [
            { id: 1, type: "image", path: path(1, "01jkqz3m5baxnp9c7hd2fewys9"), name: "autre.jpg", size: 1, mime_type: "image/jpeg" },
            { id: 2, type: "file", path: "https://cdn.example.test/file.pdf", name: "lien.pdf", size: 1, mime_type: "application/pdf" },
            // An older answer still carrying an address and no path.
            { id: 3, type: "image", url: "https://cdn.example.test/x.jpg", name: "ancien.jpg", size: 1, mime_type: "image/jpeg" } as never,
          ],
        })}
      />,
    );

    expect(screen.queryByRole("img")).toBeNull();
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByText("Voici la photo")).toBeInTheDocument();
  });

  it("writes the text of an image message once", () => {
    renderWithProviders(
      <MessageBubble
        message={message({
          attachments: [{ id: 42, type: "image", path: path(42), name: "colis.jpg", size: 2048, mime_type: "image/jpeg" }],
        })}
      />,
    );

    expect(screen.getAllByText("Voici la photo")).toHaveLength(1);
  });
});

describe("MessageBubble — masked contact details", () => {
  it("notes under the buyer's own message that details were masked", () => {
    renderWithProviders(
      <MessageBubble message={message({ message_type: "text", body: "Appelez-moi au [numéro masqué]", metadata: { masked: ["phone"] } })} />,
    );

    expect(screen.getByText(/Coordonnées masquées/)).toBeInTheDocument();
  });

  it("adds nothing when nothing was masked, nor under the other side's messages", () => {
    const { unmount } = renderWithProviders(<MessageBubble message={message({ message_type: "text", metadata: null })} />);
    expect(screen.queryByText(/Coordonnées masquées/)).toBeNull();
    unmount();

    renderWithProviders(
      <MessageBubble message={message({ message_type: "text", is_own: false, metadata: { masked: ["email"] } })} />,
    );
    const bubble = screen.getByText("Voici la photo").closest("div")!;
    expect(within(bubble).queryByText(/Coordonnées masquées/)).toBeNull();
    expect(screen.queryByText(/Coordonnées masquées/)).toBeNull();
  });
});
