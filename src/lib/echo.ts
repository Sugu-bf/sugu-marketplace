"use client";

import Echo from "laravel-echo";
import Pusher from "pusher-js";
import { API_BASE_URL } from "@/lib/api/config";

// Pusher must be on window for Echo to find it
if (typeof window !== "undefined") {
  (window as unknown as Record<string, unknown>).Pusher = Pusher;
}

let echoInstance: Echo<"reverb"> | null = null;

/**
 * Read the auth_token cookie (same logic as the API client).
 */
function getAuthToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith("auth_token="));
  return match ? decodeURIComponent(match.split("=")[1]) : null;
}

/**
 * Build the broadcasting auth endpoint from API_BASE_URL.
 * API_BASE_URL = "https://api.mysugu.com" → authEndpoint = "https://api.mysugu.com/api/broadcasting/auth"
 */
function buildAuthEndpoint(): string {
  const origin = new URL(API_BASE_URL).origin;
  return `${origin}/api/broadcasting/auth`;
}

/**
 * Get or create the singleton Echo instance.
 * Only call this client-side.
 */
export function getEcho(): Echo<"reverb"> {
  if (echoInstance) return echoInstance;

  // Security guard: don't open a WS connection without authentication
  const currentToken = getAuthToken();
  if (!currentToken) {
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
        const token = getAuthToken();
        fetch(buildAuthEndpoint(), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: "include",
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
