/**
 * Tests for recentSearches cookie helpers.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getRecentSearches,
  addRecentSearch,
  removeRecentSearch,
  clearRecentSearches,
} from "../state/recentSearches.cookie";

// Mock document.cookie
let cookieStore = "";

beforeEach(() => {
  cookieStore = "";
  Object.defineProperty(document, "cookie", {
    get: () => cookieStore,
    set: (v: string) => {
      // Basic cookie store simulation
      const [nameValue] = v.split(";");
      const [name] = nameValue.split("=");
      // Remove old value if exists
      const cookies = cookieStore
        .split("; ")
        .filter((c) => !c.startsWith(`${name}=`));
      cookies.push(nameValue);
      cookieStore = cookies.filter(Boolean).join("; ");
    },
    configurable: true,
  });
});

describe("getRecentSearches", () => {
  it("returns empty array when no cookie exists", () => {
    expect(getRecentSearches()).toEqual([]);
  });

  it("returns parsed array from cookie", () => {
    cookieStore = `sugu_recent_searches=${encodeURIComponent(JSON.stringify(["Riz", "Boeuf"]))}`;
    expect(getRecentSearches()).toEqual(["Riz", "Boeuf"]);
  });

  it("handles malformed cookie gracefully", () => {
    cookieStore = "sugu_recent_searches=not-json";
    expect(getRecentSearches()).toEqual([]);
  });
});

describe("addRecentSearch", () => {
  it("adds a term and returns updated list", () => {
    const result = addRecentSearch("Riz");
    expect(result).toEqual(["Riz"]);
  });

  it("prepends and deduplicates (case-insensitive)", () => {
    addRecentSearch("Riz");
    const result = addRecentSearch("riz");
    expect(result).toEqual(["riz"]);
  });

  it("limits to max 8 entries", () => {
    for (let i = 0; i < 10; i++) {
      addRecentSearch(`term${i}`);
    }
    const result = getRecentSearches();
    expect(result.length).toBeLessThanOrEqual(8);
    expect(result[0]).toBe("term9");
  });

  it("ignores empty/whitespace terms", () => {
    const result = addRecentSearch("   ");
    expect(result).toEqual([]);
  });
});

describe("removeRecentSearch", () => {
  it("removes a specific term", () => {
    addRecentSearch("Riz");
    addRecentSearch("Boeuf");
    const result = removeRecentSearch("Riz");
    expect(result).toEqual(["Boeuf"]);
  });

  it("handles removing non-existent term", () => {
    addRecentSearch("Riz");
    const result = removeRecentSearch("Poulet");
    expect(result).toEqual(["Riz"]);
  });
});

describe("clearRecentSearches", () => {
  it("clears all searches", () => {
    addRecentSearch("Riz");
    addRecentSearch("Boeuf");
    const result = clearRecentSearches();
    expect(result).toEqual([]);
    expect(getRecentSearches()).toEqual([]);
  });
});
