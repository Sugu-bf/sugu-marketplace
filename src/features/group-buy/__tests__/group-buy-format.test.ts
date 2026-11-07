import { describe, expect, it } from "vitest";
import {
  clockOffsetFrom,
  formatCentimes,
  formatRemaining,
  nextStepLabel,
  shareLinkOf,
} from "../lib/group-buy-format";
import { groupDetail } from "./fixtures";

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

  it("adds the sharer's own code to the link, and only that", () => {
    expect(shareLinkOf("https://sugu.pro/groupe/K7M2Q9XA", "AWA42")).toBe("https://sugu.pro/groupe/K7M2Q9XA?ref=AWA42");
    expect(shareLinkOf("https://sugu.pro/groupe/K7M2Q9XA", null)).toBe("https://sugu.pro/groupe/K7M2Q9XA");
  });
});
