import { describe, expect, it } from "vitest";
import { safeRelativePath } from "@/features/auth/services/auth-service";

describe("safeRelativePath", () => {
  it("allows only internal relative redirects", () => {
    expect(safeRelativePath("/")).toBe("/");
    expect(safeRelativePath("/account/orders?tab=open")).toBe("/account/orders?tab=open");
    expect(safeRelativePath("/checkout#shipping")).toBe("/checkout#shipping");
  });

  it("blocks external, protocol-relative, slash-backslash, and control redirects", () => {
    expect(safeRelativePath("https://evil.example")).toBe("/");
    expect(safeRelativePath("javascript:alert(1)")).toBe("/");
    expect(safeRelativePath("//evil.example")).toBe("/");
    expect(safeRelativePath("/\\evil.example")).toBe("/");
    expect(safeRelativePath("/account\nSet-Cookie:x=y")).toBe("/");
    expect(safeRelativePath("account/orders")).toBe("/");
    expect(safeRelativePath(null)).toBe("/");
  });
});
