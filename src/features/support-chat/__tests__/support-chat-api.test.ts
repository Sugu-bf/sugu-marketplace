/**
 * The support chat API as the widget calls it: a chat started from an order
 * carries `order_id`, and a message its `client_message_id` — sent again
 * with it after a network failure, the same message, written once.
 */
import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw/server";
import { setupMswServer } from "@/test/msw/setup";
import { API_BASE_URL } from "@/lib/api/config";
import { sendMessage, startChat } from "../api";

setupMswServer();

const CHAT = "01jkqz3m5baxnp9c7hd2fewyr4";
const ORDER = "01jkqz3m5baxnp9c7hd2fewyo1";
const ID = "6f1c8e5a-3b2d-4c7e-9a10-2f4b6d8e0a1c";
const START_URL = `${API_BASE_URL}/api/v1/me/support-chat/start`;
const SEND_URL = `${API_BASE_URL}/api/v1/me/support-chat/${CHAT}/messages`;

const sent = (status = 201) =>
  HttpResponse.json(
    { success: true, data: { id: "01jkqz3m5baxnp9c7hd2fewys1", client_message_id: ID, body: "Bonjour", is_own: true, attachments: [] } },
    { status },
  );

describe("startChat", () => {
  it("sends the order the chat is about, with the subject", async () => {
    let body: unknown = null;
    server.use(
      http.post(START_URL, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ success: true, data: { id: CHAT, chat_status: "waiting_agent" } }, { status: 201 });
      }),
    );

    await startChat("Commande #SGU-2026-00042", ORDER);

    expect(body).toEqual({ subject: "Commande #SGU-2026-00042", order_id: ORDER });
  });

  it("sends no order when there is none", async () => {
    let body: unknown = null;
    server.use(
      http.post(START_URL, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ success: true, data: { id: CHAT, chat_status: "waiting_agent" } }, { status: 201 });
      }),
    );

    await startChat();

    expect(body).toEqual({});
  });
});

describe("sendMessage (support chat)", () => {
  it("sends the identifier of the message", async () => {
    let form: FormData | null = null;
    server.use(
      http.post(SEND_URL, async ({ request }) => {
        form = await request.formData();
        return sent();
      }),
    );

    await sendMessage(CHAT, "Bonjour", ID);

    expect(form!.get("client_message_id")).toBe(ID);
    expect(form!.get("body")).toBe("Bonjour");
  });

  it("tries once more when the network drops the send, with the same identifier", async () => {
    const seen: (string | null)[] = [];
    server.use(
      http.post(SEND_URL, async ({ request }) => {
        seen.push((await request.formData()).get("client_message_id") as string | null);
        return seen.length === 1 ? HttpResponse.error() : sent(200);
      }),
    );

    const message = await sendMessage(CHAT, "Bonjour", ID);

    expect(seen).toEqual([ID, ID]);
    expect(message.client_message_id).toBe(ID);
  });
});
