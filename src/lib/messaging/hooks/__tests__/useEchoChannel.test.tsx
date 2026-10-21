// @vitest-environment jsdom
/**
 * useEchoChannel says whether events can arrive right now — socket connected
 * and channel subscribed — so a caller polls only while they cannot. It
 * reuses the one Echo socket of the page (getEcho), never opens another, and
 * two components following the same channel do not disturb each other: each
 * removes only its own listeners, the channel is left with the last one.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, act } from "@/test/render";

const { getEcho } = vi.hoisted(() => ({ getEcho: vi.fn() }));
vi.mock("@/lib/echo", () => ({ getEcho }));

import { useEchoChannel } from "../useEchoChannel";

type Handler = (payload?: unknown) => void;

/** A Pusher channel as far as the hook sees it: bind / unbind / subscribed. */
function fakeSubscription() {
  const handlers = new Map<string, Set<Handler>>();
  return {
    subscribed: false,
    bind(event: string, cb: Handler) {
      if (!handlers.has(event)) handlers.set(event, new Set());
      handlers.get(event)!.add(cb);
    },
    unbind(event: string, cb?: Handler) {
      if (cb) handlers.get(event)?.delete(cb);
      else handlers.delete(event);
    },
    emit(event: string, payload?: unknown) {
      handlers.get(event)?.forEach((cb) => cb(payload));
    },
    count(event: string) {
      return handlers.get(event)?.size ?? 0;
    },
  };
}

function fakeEcho() {
  let status = "connecting";
  const onConnection = new Set<(s: string) => void>();
  const subscription = fakeSubscription();
  // Echo's channel: listen / stopListening go to the subscription, the way
  // laravel-echo does (stopListening with a callback unbinds only it).
  const channel = {
    subscription,
    listen(event: string, cb: Handler) {
      subscription.bind(event, cb);
      return channel;
    },
    stopListening(event: string, cb?: Handler) {
      subscription.unbind(event, cb);
      return channel;
    },
  };
  const echo = {
    private: vi.fn(() => channel),
    leave: vi.fn(),
    connectionStatus: () => status,
    connector: {
      onConnectionChange(cb: (s: string) => void) {
        onConnection.add(cb);
        return () => onConnection.delete(cb);
      },
    },
  };
  return {
    echo,
    subscription,
    watchers: onConnection,
    connected() {
      status = "connected";
      onConnection.forEach((cb) => cb(status));
    },
    subscribed() {
      subscription.subscribed = true;
      subscription.emit("pusher:subscription_succeeded");
    },
    dropped() {
      status = "disconnected";
      subscription.subscribed = false;
      onConnection.forEach((cb) => cb(status));
    },
  };
}

beforeEach(() => {
  getEcho.mockReset();
});

describe("useEchoChannel — live state", () => {
  it("is live once connected and subscribed, not before, not after a drop", async () => {
    const fake = fakeEcho();
    getEcho.mockReturnValue(fake.echo);
    const { result } = renderHook(() => useEchoChannel("support.chat.customer.u1", { "support.message.created": () => {} }));
    await act(async () => {});

    expect(result.current).toBe(false);

    act(() => fake.connected());
    expect(result.current).toBe(false);

    act(() => fake.subscribed());
    expect(result.current).toBe(true);

    act(() => fake.dropped());
    expect(result.current).toBe(false);

    // Pusher subscribes again once back.
    act(() => {
      fake.connected();
      fake.subscribed();
    });
    expect(result.current).toBe(true);
    expect(getEcho).toHaveBeenCalledTimes(1);
  });

  it("is live at once when the channel was already subscribed", async () => {
    const fake = fakeEcho();
    fake.connected();
    fake.subscribed();
    getEcho.mockReturnValue(fake.echo);

    const { result } = renderHook(() => useEchoChannel("messaging.user.u1", {}));

    await act(async () => {});
    expect(result.current).toBe(true);
  });

  it("hands each event to its handler", async () => {
    const fake = fakeEcho();
    getEcho.mockReturnValue(fake.echo);
    const handler = vi.fn();
    renderHook(() => useEchoChannel("support.chat.customer.u1", { "support.message.created": handler }));
    await act(async () => {});

    fake.subscription.emit(".support.message.created", { conversation_id: "c1" });

    expect(handler).toHaveBeenCalledWith({ conversation_id: "c1" });
  });

  it("is never live without a channel, or without realtime", () => {
    const { result: none } = renderHook(() => useEchoChannel(null, {}));
    expect(none.current).toBe(false);
    expect(getEcho).not.toHaveBeenCalled();

    getEcho.mockImplementation(() => {
      throw new Error("Echo: REVERB env vars not configured");
    });
    const { result: unavailable } = renderHook(() => useEchoChannel("support.chat.customer.u1", {}));
    expect(unavailable.current).toBe(false);
  });

  it("leaves the channel and stops watching the socket when done", async () => {
    const fake = fakeEcho();
    getEcho.mockReturnValue(fake.echo);
    const { unmount } = renderHook(() => useEchoChannel("support.chat.customer.u1", { "support.typing": () => {} }));
    await act(async () => {});

    unmount();

    expect(fake.echo.leave).toHaveBeenCalledWith("private-support.chat.customer.u1");
    expect(fake.watchers.size).toBe(0);
    expect(fake.subscription.count(".support.typing")).toBe(0);
    expect(fake.subscription.count("pusher:subscription_succeeded")).toBe(0);
  });
});

describe("useEchoChannel — two subscribers of the same channel", () => {
  const CHANNEL = "messaging.user.u1";

  it("subscribes once, and both receive each event", async () => {
    const fake = fakeEcho();
    getEcho.mockReturnValue(fake.echo);
    const first = vi.fn();
    const second = vi.fn();
    renderHook(() => useEchoChannel(CHANNEL, { "message.created": first }));
    renderHook(() => useEchoChannel(CHANNEL, { "message.created": second }));
    await act(async () => {});

    fake.subscription.emit(".message.created", { id: "m1" });

    expect(fake.echo.private).toHaveBeenCalledTimes(1);
    expect(first).toHaveBeenCalledWith({ id: "m1" });
    expect(second).toHaveBeenCalledWith({ id: "m1" });
  });

  it("keeps the other one listening, and live, when one goes", async () => {
    const fake = fakeEcho();
    getEcho.mockReturnValue(fake.echo);
    const first = vi.fn();
    const second = vi.fn();
    const one = renderHook(() => useEchoChannel(CHANNEL, { "message.created": first }));
    const two = renderHook(() => useEchoChannel(CHANNEL, { "message.created": second }));
    await act(async () => {});
    act(() => {
      fake.connected();
      fake.subscribed();
    });

    one.unmount();
    fake.subscription.emit(".message.created", { id: "m2" });

    expect(fake.echo.leave).not.toHaveBeenCalled();
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledWith({ id: "m2" });
    expect(two.result.current).toBe(true);

    // The socket drops and comes back: the one left still follows it.
    act(() => fake.dropped());
    expect(two.result.current).toBe(false);
    act(() => {
      fake.connected();
      fake.subscribed();
    });
    expect(two.result.current).toBe(true);
  });

  it("leaves the channel once, with the last one", async () => {
    const fake = fakeEcho();
    getEcho.mockReturnValue(fake.echo);
    const one = renderHook(() => useEchoChannel(CHANNEL, { "message.created": () => {} }));
    const two = renderHook(() => useEchoChannel(CHANNEL, { "message.read": () => {} }));
    await act(async () => {});

    one.unmount();
    expect(fake.echo.leave).not.toHaveBeenCalled();
    expect(fake.subscription.count(".message.created")).toBe(0);
    expect(fake.subscription.count(".message.read")).toBe(1);

    two.unmount();
    expect(fake.echo.leave).toHaveBeenCalledTimes(1);
    expect(fake.echo.leave).toHaveBeenCalledWith(`private-${CHANNEL}`);
    expect(fake.subscription.count(".message.read")).toBe(0);
  });

  it("subscribes again after the last one has gone", async () => {
    const fake = fakeEcho();
    getEcho.mockReturnValue(fake.echo);
    const one = renderHook(() => useEchoChannel(CHANNEL, {}));
    await act(async () => {});
    one.unmount();

    renderHook(() => useEchoChannel(CHANNEL, {}));
    await act(async () => {});

    expect(fake.echo.private).toHaveBeenCalledTimes(2);
  });
});
