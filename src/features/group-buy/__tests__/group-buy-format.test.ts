import { describe, expect, it } from "vitest";
import {
  STATUS_LABELS,
  closingTierAt,
  clockOffsetFrom,
  formatCentimes,
  formatDeadline,
  formatRemaining,
  isBulkReservation,
  nextStepLabel,
  shareLinkOf,
} from "../lib/group-buy-format";
import { CONFIRM_RULES, groupDetail } from "./fixtures";

const digits = (text: string) => text.replace(/\D/g, "");

describe("group buy formats", () => {
  it("shows centimes as whole francs", () => {
    expect(digits(formatCentimes(590_000))).toBe("5900");
    expect(digits(formatCentimes(590_049))).toBe("5900");
  });

  it("counts down in a way that never reads as a time of day", () => {
    expect(formatRemaining(2 * 86_400_000 + 4 * 3_600_000)).toBe("2 j 04 h");
    expect(formatRemaining(23 * 3_600_000 + 5 * 60_000 + 9_000)).toBe("23 h 05 min");
    expect(formatRemaining(12 * 60_000 + 9_000)).toBe("12 min 09 s");
    expect(formatRemaining(45_000)).toBe("45 s");
    expect(formatRemaining(0)).toBeNull();
    expect(formatRemaining(-5)).toBeNull();
  });

  it("measures the device clock against the server's", () => {
    const received = Date.parse("2026-11-06T12:00:00Z");
    expect(clockOffsetFrom("2026-11-06T12:05:00Z", received)).toBe(5 * 60_000);
    expect(clockOffsetFrom(null, received)).toBe(0);
    expect(clockOffsetFrom("not a date", received)).toBe(0);
  });

  it("says what the group misses for its next tier", () => {
    expect(nextStepLabel(groupDetail())).toMatch(/^Plus que 1 pour passer à 5\s?900/);
    expect(nextStepLabel(groupDetail({ next_tier: null, current_tier_min_qty: 5 }))).toBe("Meilleur prix atteint");
    expect(nextStepLabel(groupDetail({ status: "locked", current_unit_price: 540_000 }))).toMatch(/^Prix final/);
  });

  it("names the confirmation and says the price is not final yet", () => {
    expect(STATUS_LABELS.confirming).toBe("Confirmation du prix");
    expect(nextStepLabel(groupDetail({ status: "confirming", current_unit_price: 590_000 }))).toMatch(/^Prix provisoire/);
  });

  it("tells a deadline as a time of day, today or tomorrow", () => {
    const now = Date.parse("2026-11-06T12:00:00Z");
    const options = { now, timeZone: "UTC" };
    expect(formatDeadline("2026-11-06T18:30:00Z", options)).toBe("18:30");
    expect(formatDeadline("2026-11-07T08:05:00Z", options)).toBe("demain à 08:05");
    expect(formatDeadline("2026-11-12T08:05:00Z", options)).toBe("12/11 à 08:05");
    expect(formatDeadline(null, options)).toBeNull();
  });

  it("spots a reservation that pays first, like the server", () => {
    const tiers = [
      { min_qty: 10, unit_price: 590_000 },
      { min_qty: 20, unit_price: 540_000 },
    ];
    // 5 units of a 10-unit tier: half of it.
    expect(isBulkReservation(5, closingTierAt(tiers, 12), CONFIRM_RULES)).toBe(true);
    // 5 units once the group reached 20: a quarter.
    expect(isBulkReservation(5, closingTierAt(tiers, 22), CONFIRM_RULES)).toBe(false);
    // Under the minimum quantity, unless the amount is large.
    expect(isBulkReservation(4, closingTierAt(tiers, 4), CONFIRM_RULES)).toBe(false);
    expect(isBulkReservation(4, closingTierAt(tiers, 4), { ...CONFIRM_RULES, amount: 2_000_000 })).toBe(true);
    // No rules from an older API: never.
    expect(isBulkReservation(50, closingTierAt(tiers, 50), null)).toBe(false);
  });

  it("adds the sharer's own code to the link, and only that", () => {
    expect(shareLinkOf("https://sugu.pro/groupe/K7M2Q9XA", "AWA42")).toBe("https://sugu.pro/groupe/K7M2Q9XA?ref=AWA42");
    expect(shareLinkOf("https://sugu.pro/groupe/K7M2Q9XA", null)).toBe("https://sugu.pro/groupe/K7M2Q9XA");
  });
});
