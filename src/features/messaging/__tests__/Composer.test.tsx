// @vitest-environment jsdom
/**
 * The buyer's composer gives each message an identifier, once. A send that
 * failed keeps the text, says so, and sent again goes with the same
 * identifier, so the server never writes it twice. Once the text changes it
 * is another message, with another identifier.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw/server";
import { setupMswServer } from "@/test/msw/setup";
import { API_BASE_URL } from "@/lib/api/config";
import { renderWithProviders, screen, fireEvent, waitFor } from "@/test/render";
import { Composer } from "../components/Composer";

setupMswServer();

const CONV = "01jkqz3m5baxnp9c7hd2fewyr4";
const SEND_URL = `${API_BASE_URL}/api/v1/me/conversations/${CONV}/messages`;
const TYPING_URL = `${API_BASE_URL}/api/v1/me/conversations/${CONV}/typing`;
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

/** Answers each send in turn with the given status, records the ids. */
function serverAnswering(...statuses: number[]) {
  const ids: string[] = [];
  server.use(
    http.post(TYPING_URL, () => HttpResponse.json({ success: true })),
    http.post(SEND_URL, async ({ request }) => {
      const body = (await request.json()) as { client_message_id: string; body: string };
      ids.push(body.client_message_id);
      const status = statuses[ids.length - 1] ?? 201;
      if (status >= 400) {
        return HttpResponse.json({ success: false, message: status === 422 ? "Le message est trop long." : "Erreur" }, { status });
      }
      return HttpResponse.json(
        { success: true, data: { id: "01jkqz3m5baxnp9c7hd2fewys1", client_message_id: body.client_message_id, body: body.body, attachments: [] } },
        { status },
      );
    }),
  );
  return ids;
}

const textarea = () => screen.getByPlaceholderText("Écrivez votre message...") as HTMLTextAreaElement;
const type = (value: string) => fireEvent.change(textarea(), { target: { value } });
const send = () => fireEvent.click(screen.getByRole("button", { name: "Envoyer le message" }));

describe("Composer — sending without duplicates", () => {
  it("sends a message with a fresh UUID and empties the field once it has gone", async () => {
    const ids = serverAnswering(201);
    renderWithProviders(<Composer conversationId={CONV} />);

    type("Bonjour");
    send();

    await waitFor(() => expect(textarea().value).toBe(""));
    expect(ids).toHaveLength(1);
    expect(ids[0]).toMatch(UUID_V4);
  });

  it("keeps the text after a failure, says so, and sends it again with the same identifier", async () => {
    const ids = serverAnswering(500, 200);
    renderWithProviders(<Composer conversationId={CONV} />);

    type("Bonjour");
    send();

    expect(await screen.findByRole("alert")).toHaveTextContent("Votre message n'est pas parti. Réessayez.");
    expect(textarea().value).toBe("Bonjour");

    send();

    await waitFor(() => expect(textarea().value).toBe(""));
    expect(ids).toHaveLength(2);
    expect(ids[1]).toBe(ids[0]);
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("gives another identifier to a text changed after a failure", async () => {
    const ids = serverAnswering(500, 201);
    renderWithProviders(<Composer conversationId={CONV} />);

    type("Bonjour");
    send();
    await screen.findByRole("alert");

    type("Bonjour, le colis est-il parti ?");
    send();

    await waitFor(() => expect(ids).toHaveLength(2));
    expect(ids[1]).not.toBe(ids[0]);
  });

  it("gives the next message its own identifier", async () => {
    const ids = serverAnswering(201, 201);
    renderWithProviders(<Composer conversationId={CONV} />);

    type("Bonjour");
    send();
    await waitFor(() => expect(textarea().value).toBe(""));

    type("Bonjour");
    send();
    await waitFor(() => expect(ids).toHaveLength(2));

    expect(ids[1]).not.toBe(ids[0]);
  });

  it("shows the server's words when it refuses the message", async () => {
    serverAnswering(422);
    renderWithProviders(<Composer conversationId={CONV} />);

    type("Bonjour");
    send();

    expect(await screen.findByRole("alert")).toHaveTextContent("Le message est trop long.");
  });

  it("offers no control that does nothing", () => {
    serverAnswering();
    renderWithProviders(<Composer conversationId={CONV} />);

    expect(screen.queryByRole("button", { name: "Emoji" })).toBeNull();
  });
});

describe("Composer — one draft per conversation", () => {
  const OTHER = "01jkqz3m5baxnp9c7hd2fewyr5";
  const OTHER_SEND_URL = `${API_BASE_URL}/api/v1/me/conversations/${OTHER}/messages`;
  const OTHER_TYPING_URL = `${API_BASE_URL}/api/v1/me/conversations/${OTHER}/typing`;

  beforeEach(() => {
    URL.createObjectURL = vi.fn(() => "blob:apercu");
    URL.revokeObjectURL = vi.fn();
  });

  it("drops the text and the files when the conversation changes", () => {
    serverAnswering();
    server.use(http.post(OTHER_TYPING_URL, () => HttpResponse.json({ success: true })));
    const { rerender } = renderWithProviders(<Composer conversationId={CONV} />);

    type("Pour la boutique Awa");
    const picker = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(picker, { target: { files: [new File([new Uint8Array(3)], "colis.png", { type: "image/png" })] } });
    expect(screen.getByRole("button", { name: "Retirer colis.png" })).toBeInTheDocument();

    rerender(<Composer conversationId={OTHER} />);

    expect(textarea().value).toBe("");
    expect(screen.queryByRole("button", { name: "Retirer colis.png" })).toBeNull();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:apercu");
  });

  it("does not carry a failed send, nor its identifier, into another conversation", async () => {
    const ids = serverAnswering(500);
    const otherIds: string[] = [];
    server.use(
      http.post(OTHER_TYPING_URL, () => HttpResponse.json({ success: true })),
      http.post(OTHER_SEND_URL, async ({ request }) => {
        const body = (await request.json()) as { client_message_id: string; body: string };
        otherIds.push(body.client_message_id);
        return HttpResponse.json(
          { success: true, data: { id: "01jkqz3m5baxnp9c7hd2fewys9", client_message_id: body.client_message_id, body: body.body, attachments: [] } },
          { status: 201 },
        );
      }),
    );
    const { rerender } = renderWithProviders(<Composer conversationId={CONV} />);

    type("Bonjour");
    send();
    await screen.findByRole("alert");

    rerender(<Composer conversationId={OTHER} />);
    expect(screen.queryByRole("alert")).toBeNull();
    expect(textarea().value).toBe("");

    type("Bonjour");
    send();

    await waitFor(() => expect(otherIds).toHaveLength(1));
    expect(otherIds[0]).not.toBe(ids[0]);
  });
});
