/**
 * A message is sent with its `client_message_id`. Sent again with it, the
 * server answers the same message: that makes it safe for the client to try
 * a send once more by itself when the network drops it, with the same id.
 */
import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw/server";
import { setupMswServer } from "@/test/msw/setup";
import { API_BASE_URL } from "@/lib/api/config";
import { sendMessage, sendProductCard } from "../api";

setupMswServer();

const CONV = "01jkqz3m5baxnp9c7hd2fewyr4";
const SEND_URL = `${API_BASE_URL}/api/v1/me/conversations/${CONV}/messages`;
const CARD_URL = `${API_BASE_URL}/api/v1/me/conversations/${CONV}/product-card`;
const ID = "6f1c8e5a-3b2d-4c7e-9a10-2f4b6d8e0a1c";

const answer = (status = 201) =>
  HttpResponse.json(
    { success: true, data: { id: "01jkqz3m5baxnp9c7hd2fewys1", client_message_id: ID, body: "Bonjour", attachments: [] } },
    { status },
  );

describe("sendMessage", () => {
  it("sends the identifier with a text", async () => {
    let body: unknown = null;
    server.use(
      http.post(SEND_URL, async ({ request }) => {
        body = await request.json();
        return answer();
      }),
    );

    const message = await sendMessage(CONV, "Bonjour", undefined, ID);

    expect(body).toEqual({ body: "Bonjour", client_message_id: ID });
    expect(message.client_message_id).toBe(ID);
  });

  it("sends the identifier with files", async () => {
    let form: FormData | null = null;
    server.use(
      http.post(SEND_URL, async ({ request }) => {
        form = await request.formData();
        return answer();
      }),
    );

    await sendMessage(CONV, " ", [new File([new Uint8Array([1, 2, 3])], "photo.png", { type: "image/png" })], ID);

    expect(form!.get("client_message_id")).toBe(ID);
    expect(form!.get("body")).toBe(" ");
    expect((form!.getAll("attachments[]")[0] as File).name).toBe("photo.png");
  });

  it("tries once more when the network drops the send, with the same identifier", async () => {
    const seen: unknown[] = [];
    server.use(
      http.post(SEND_URL, async ({ request }) => {
        seen.push(((await request.json()) as { client_message_id: string }).client_message_id);
        return seen.length === 1 ? HttpResponse.error() : answer(200);
      }),
    );

    const message = await sendMessage(CONV, "Bonjour", undefined, ID);

    expect(seen).toEqual([ID, ID]);
    expect(message.client_message_id).toBe(ID);
  });

  it("does not send again a message the server refused", async () => {
    let calls = 0;
    server.use(
      http.post(SEND_URL, () => {
        calls++;
        return HttpResponse.json({ success: false, message: "Conversation fermée." }, { status: 403 });
      }),
    );

    await expect(sendMessage(CONV, "Bonjour", undefined, ID)).rejects.toMatchObject({ status: 403 });
    expect(calls).toBe(1);
  });
});

describe("sendProductCard", () => {
  it("sends the identifier with the card", async () => {
    let body: unknown = null;
    server.use(
      http.post(CARD_URL, async ({ request }) => {
        body = await request.json();
        return answer();
      }),
    );

    await sendProductCard(CONV, "01jkqz3m5baxnp9c7hd2fewyp1", ID);

    expect(body).toEqual({ product_id: "01jkqz3m5baxnp9c7hd2fewyp1", client_message_id: ID });
  });
});
