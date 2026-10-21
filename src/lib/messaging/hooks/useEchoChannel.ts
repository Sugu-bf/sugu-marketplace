"use client";

import { useEffect, useRef, useState } from "react";
import { getEcho } from "@/lib/echo";

type EchoInstance = ReturnType<typeof getEcho>;
type PrivateChannel = ReturnType<EchoInstance["private"]>;

/**
 * The private channels the page follows, shared by everyone who listens to
 * the same one: subscribed once, left once the last listener has gone.
 * Kept per Echo instance, so a new socket (after a sign-out) starts clean.
 */
const sharedChannels = new WeakMap<EchoInstance, Map<string, { channel: PrivateChannel; listeners: number }>>();

function acquireChannel(echo: EchoInstance, name: string): PrivateChannel {
  let channels = sharedChannels.get(echo);
  if (!channels) {
    channels = new Map();
    sharedChannels.set(echo, channels);
  }
  let entry = channels.get(name);
  if (!entry) {
    entry = { channel: echo.private(name), listeners: 0 };
    channels.set(name, entry);
  }
  entry.listeners++;
  return entry.channel;
}

function releaseChannel(echo: EchoInstance, name: string): void {
  const channels = sharedChannels.get(echo);
  const entry = channels?.get(name);
  if (!channels || !entry) return;
  entry.listeners--;
  if (entry.listeners <= 0) {
    channels.delete(name);
    echo.leave(`private-${name}`);
  }
}

/**
 * Subscribe to a private Echo channel and bind event listeners.
 *
 * Several components may follow the same channel: each one adds and removes
 * only its own listeners, and the channel is left when the last one goes.
 *
 * @param channelName - The channel name (e.g. "messaging.user.{userId}").
 *                      Pass null/undefined to skip subscription (lazy init).
 * @param events      - Map of event names → callbacks.
 *                      Event names should match `broadcastAs()` (e.g. "message.created").
 * @returns Whether events can arrive right now: the socket is connected and
 *          the channel subscribed. False while it connects, after a drop
 *          (until Pusher has subscribed again), when the channel is refused,
 *          and when realtime is not available at all: a caller polls then.
 */
export function useEchoChannel(
  channelName: string | null | undefined,
  events: Record<string, (payload: unknown) => void>,
): boolean {
  // Stabilize events ref to avoid re-subscribing on every render
  const eventsRef = useRef(events);
  useEffect(() => {
    eventsRef.current = events;
  });

  // The channel that is live, so a live state never outlives its channel.
  const [liveChannel, setLiveChannel] = useState<string | null>(null);

  useEffect(() => {
    if (!channelName) return;

    // Security: validate channel name format to prevent injection
    if (!/^[\w.-]+$/.test(channelName)) {
      if (process.env.NODE_ENV === "development") {
        console.warn(`[useEchoChannel] Rejected invalid channel name: ${channelName}`);
      }
      return;
    }

    let echo: EchoInstance;
    try {
      echo = getEcho();
    } catch {
      return; // SSR or Echo not available
    }

    const channel = acquireChannel(echo, channelName);
    const subscription = channel.subscription;
    let active = true;

    // Pusher's own flag: set on subscription, cleared when the connection
    // drops, set again once it has subscribed after reconnecting.
    const refresh = () => {
      if (!active) return;
      const live = subscription?.subscribed === true
        && echo.connectionStatus() === "connected";
      setLiveChannel(live ? channelName : null);
    };
    subscription?.bind("pusher:subscription_succeeded", refresh);
    subscription?.bind("pusher:subscription_error", refresh);
    const stopWatching = echo.connector.onConnectionChange(refresh);
    // The channel may already be subscribed by another listener.
    queueMicrotask(refresh);

    // Bind all events — Echo expects a `.` prefix for custom broadcastAs names.
    // Each listener is this component's own, and only it is removed after.
    const handlers = Object.keys(eventsRef.current).map((name) => {
      const handler = (payload: unknown) => {
        eventsRef.current[name]?.(payload);
      };
      channel.listen(`.${name}`, handler);
      return [name, handler] as const;
    });

    return () => {
      active = false;
      setLiveChannel(null);
      stopWatching();
      subscription?.unbind("pusher:subscription_succeeded", refresh);
      subscription?.unbind("pusher:subscription_error", refresh);
      for (const [name, handler] of handlers) {
        channel.stopListening(`.${name}`, handler);
      }
      releaseChannel(echo, channelName);
    };
  }, [channelName]);

  return !!channelName && liveChannel === channelName;
}
