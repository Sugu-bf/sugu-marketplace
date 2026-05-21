"use client";

import Echo from "laravel-echo";
import Pusher from "pusher-js";

// Pusher must be on window for Echo to find it
if (typeof window !== "undefined") {
  (window as unknown as Record<string, unknown>).Pusher = Pusher;
}

let echoInstance: Echo<"reverb"> | null = null;

/**
 * Read only the non-sensitive session hint. The real Sanctum token is HttpOnly
 * and is injected by /api/broadcasting/auth server-side.
 */
function hasSessionHint(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie
    .split("; ")
    .some((row) => row.startsWith("auth_token_expires_at="));
}

function buildAuthEndpoint(): string {
  return "/api/broadcasting/auth";
}

/**
 * Get or create the singleton Echo instance.
 * Only call this client-side.
 */
export function getEcho(): Echo<"reverb"> {
  if (echoInstance) return echoInstance;

  // Guard: don't init Echo if REVERB env vars are missing
  if (!process.env.NEXT_PUBLIC_REVERB_APP_KEY || !process.env.NEXT_PUBLIC_REVERB_HOST) {
    throw new Error("Echo: REVERB env vars not configured");
  }

  // Security guard: don't open a WS connection without authentication
  if (!hasSessionHint()) {
    throw new Error("Cannot initialize Echo: user is not authenticated");
  }

  echoInstance = new Echo({
    broadcaster: "reverb",
    key: process.env.NEXT_PUBLIC_REVERB_APP_KEY,
    wsHost: process.env.NEXT_PUBLIC_REVERB_HOST,
    wsPort: Number(process.env.NEXT_PUBLIC_REVERB_PORT ?? 8080),
    wssPort: Number(process.env.NEXT_PUBLIC_REVERB_PORT ?? 8080),
    forceTLS: process.env.NEXT_PUBLIC_REVERB_SCHEME === "https",
    enabledTransports: ["ws", "wss"],
    // Use authorizer callback so the token is read fresh on every
    // channel subscription (not frozen at singleton creation time).
    authorizer: (channel: { name: string }) => ({
      authorize: (
        socketId: string,
        callback: (error: Error | null, authData: { auth: string; channel_data?: string } | null) => void,
      ) => {
        fetch(buildAuthEndpoint(), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          credentials: "same-origin",
          body: JSON.stringify({
            socket_id: socketId,
            channel_name: channel.name,
          }),
        })
          .then((res) => {
            if (!res.ok) throw new Error("Channel authorization failed");
            return res.json();
          })
          .then((data) => callback(null, data))
          .catch((err) => callback(err instanceof Error ? err : new Error(String(err)), null));
      },
    }),
  });

  return echoInstance;
}

/**
 * Disconnect and destroy the Echo instance.
 * Call this on logout to ensure a fresh instance with the new token.
 */
export function disconnectEcho(): void {
  if (echoInstance) {
    echoInstance.disconnect();
    echoInstance = null;
  }
}
