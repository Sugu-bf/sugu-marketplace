"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getEcho } from "@/lib/echo";
import { fetchGroupBuy } from "../api/group-buy.api";
import {
  GroupBuyProgressSchema,
  type GroupBuyDetail,
  type GroupBuyDetailResponse,
} from "../api/group-buy.schemas";
import { clockOffsetFrom } from "../lib/group-buy-format";

/** Refresh rhythm: realtime when it is there, a light poll as the fallback. */
const POLL_OPEN_MS = 20_000;
const POLL_LOCKED_MS = 60_000;
const POLL_WITH_REALTIME_MS = 60_000;
/** Right after a deadline (close, end of confirmation), while the server moves the group on. */
const POLL_CLOSING_MS = 5_000;
const CLOSING_WINDOW_MS = 3 * 60_000;
/** A realtime nudge triggers one full refresh, grouped over this delay. */
const NUDGE_DEBOUNCE_MS = 2_500;

interface LiveGroupBuy {
  group: GroupBuyDetail;
  /** Server time minus device time: add it to Date.now() for countdowns. */
  offset: number;
  /** True while realtime events can arrive. */
  realtime: boolean;
  refresh: () => Promise<void>;
  /** Show the group a mutation returned (join, leave, quantity…). */
  apply: (response: GroupBuyDetailResponse) => void;
}

/**
 * Keeps a group page current without reloading it: the public realtime
 * channel `group-buys.{code}` when a socket can be opened (signed-in
 * visitors), a poll otherwise. The poll pauses while the tab is hidden and
 * stops once the group is over.
 */
export function useGroupBuyLive(initial: GroupBuyDetailResponse): LiveGroupBuy {
  const code = initial.data.code;
  const [group, setGroup] = useState<GroupBuyDetail>(initial.data);
  const [offset, setOffset] = useState(() => clockOffsetFrom(initial.server_now));
  const [realtime, setRealtime] = useState(false);

  // The poll reads the latest values without restarting at each change.
  const groupRef = useRef(group);
  const offsetRef = useRef(offset);
  const inFlight = useRef<AbortController | null>(null);
  useEffect(() => {
    groupRef.current = group;
    offsetRef.current = offset;
  }, [group, offset]);

  const apply = useCallback((response: GroupBuyDetailResponse) => {
    setGroup(response.data);
    setOffset(clockOffsetFrom(response.server_now));
  }, []);

  const refresh = useCallback(async () => {
    inFlight.current?.abort();
    const controller = new AbortController();
    inFlight.current = controller;
    try {
      const response = await fetchGroupBuy(code, { signal: controller.signal });
      if (!controller.signal.aborted) apply(response);
    } catch {
      // Keep what is shown; the next tick tries again.
    } finally {
      if (inFlight.current === controller) inFlight.current = null;
    }
  }, [apply, code]);

  // ── Poll (fallback and safety net) ──
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    let stopped = false;

    const nextDelay = (): number | null => {
      const current = groupRef.current;
      if (current.status === "failed" || current.status === "finished" || current.status === "cancelled") {
        return null;
      }
      // Right after a deadline the server moves the group on: open → confirming
      // or locked at `closes_at`, confirming → locked or failed at `confirm_deadline_at`.
      const deadline =
        current.status === "open" ? current.closes_at
          : current.status === "confirming" ? current.confirm_deadline_at ?? null
            : null;
      if (deadline) {
        const sinceDeadline = Date.now() + offsetRef.current - Date.parse(deadline);
        if (sinceDeadline >= 0 && sinceDeadline < CLOSING_WINDOW_MS) return POLL_CLOSING_MS;
      }
      if (realtime) return POLL_WITH_REALTIME_MS;
      // While the price is confirmed, payments land at any time: polled like an open group.
      return current.status === "locked" ? POLL_LOCKED_MS : POLL_OPEN_MS;
    };

    const schedule = () => {
      if (stopped) return;
      const delay = nextDelay();
      if (delay === null) return;
      timer = setTimeout(async () => {
        if (document.visibilityState === "visible") await refresh();
        schedule();
      }, delay);
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };

    document.addEventListener("visibilitychange", onVisible);
    schedule();
    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh, realtime, group.status]);

  // ── Realtime (public channel, no personal data) ──
  useEffect(() => {
    let echo: ReturnType<typeof getEcho>;
    try {
      echo = getEcho();
    } catch {
      return; // guest, or realtime not configured: the poll does the work
    }

    const name = `group-buys.${code}`;
    let nudge: ReturnType<typeof setTimeout> | null = null;
    const channel = echo.channel(name);

    channel.listen(".group_buy.progress", (payload: unknown) => {
      const parsed = GroupBuyProgressSchema.safeParse(payload);
      if (!parsed.success || parsed.data.code !== code) return;
      const progress = parsed.data;
      setOffset(clockOffsetFrom(progress.server_now));
      setGroup((previous) => ({
        ...previous,
        ...progress,
        tiers: previous.tiers.map((tier) => ({ ...tier, reached: progress.reserved_qty >= tier.min_qty })),
        remaining_qty: Math.max(0, progress.max_qty - progress.reserved_qty),
      }));
      // The members list and what the viewer may do come with a full read.
      if (nudge) clearTimeout(nudge);
      nudge = setTimeout(() => void refresh(), NUDGE_DEBOUNCE_MS);
    });
    channel.subscribed(() => setRealtime(true));
    channel.error(() => setRealtime(false));

    return () => {
      if (nudge) clearTimeout(nudge);
      setRealtime(false);
      echo.leave(name);
    };
  }, [code, refresh]);

  useEffect(() => () => inFlight.current?.abort(), []);

  return { group, offset, realtime, refresh, apply };
}
