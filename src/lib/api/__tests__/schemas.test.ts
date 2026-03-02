/**
 * Tests for lib/api/schemas — Zod schema validation
 */
import { describe, it, expect } from "vitest";
import { z } from "zod";
import {
  PaginationMetaSchema,
  PaginationLinksSchema,
  paginatedSchema,
  successSchema,
  MessageResponseSchema,
  MediaSchema,
  ImageSchema,
} from "@/lib/api/schemas";

describe("PaginationMetaSchema", () => {
  it("should validate correct pagination meta", () => {
    const result = PaginationMetaSchema.safeParse({
      current_page: 1,
      last_page: 5,
      per_page: 20,
      total: 100,
      from: 1,
      to: 20,
    });
    expect(result.success).toBe(true);
  });

  it("should allow null from/to values", () => {
    const result = PaginationMetaSchema.safeParse({
      current_page: 1,
      last_page: 1,
      per_page: 20,
      total: 0,
      from: null,
      to: null,
    });
    expect(result.success).toBe(true);
  });

  it("should reject missing fields", () => {
    const result = PaginationMetaSchema.safeParse({ current_page: 1 });
    expect(result.success).toBe(false);
  });
});

describe("PaginationLinksSchema", () => {
  it("should validate correct pagination links", () => {
    const result = PaginationLinksSchema.safeParse({
      first: "https://api.example.com/v1/items?page=1",
      last: "https://api.example.com/v1/items?page=5",
      prev: null,
      next: "https://api.example.com/v1/items?page=2",
    });
    expect(result.success).toBe(true);
  });
});

describe("paginatedSchema", () => {
  it("should validate paginated response with items", () => {
    const itemSchema = z.object({ id: z.string(), name: z.string() });
    const schema = paginatedSchema(itemSchema);

    const result = schema.safeParse({
      data: [
        { id: "1", name: "Test" },
        { id: "2", name: "Test 2" },
      ],
      meta: {
        current_page: 1,
        last_page: 1,
        per_page: 20,
        total: 2,
        from: 1,
        to: 2,
      },
      links: {
        first: null,
        last: null,
        prev: null,
        next: null,
      },
    });
    expect(result.success).toBe(true);
  });

  it("should reject items that don't match the schema", () => {
    const itemSchema = z.object({ id: z.string() });
    const schema = paginatedSchema(itemSchema);

    const result = schema.safeParse({
      data: [{ wrong: "field" }],
      meta: {
        current_page: 1,
        last_page: 1,
        per_page: 20,
        total: 1,
        from: 1,
        to: 1,
      },
      links: { first: null, last: null, prev: null, next: null },
    });
    expect(result.success).toBe(false);
  });
});

describe("successSchema", () => {
  it("should validate success response", () => {
    const schema = successSchema(z.object({ id: z.string() }));
    const result = schema.safeParse({
      success: true,
      data: { id: "abc" },
    });
    expect(result.success).toBe(true);
  });

  it("should reject response with success: false", () => {
    const schema = successSchema(z.object({ id: z.string() }));
    const result = schema.safeParse({
      success: false,
      data: { id: "abc" },
    });
    expect(result.success).toBe(false);
  });
});

describe("MessageResponseSchema", () => {
  it("should validate message response", () => {
    const result = MessageResponseSchema.safeParse({
      success: true,
      message: "Operation successful",
    });
    expect(result.success).toBe(true);
  });
});

describe("MediaSchema", () => {
  it("should validate a media object", () => {
    const result = MediaSchema.safeParse({
      id: "123",
      url: "https://cdn.example.com/photo.jpg",
      thumb_url: "https://cdn.example.com/photo-thumb.jpg",
      name: "photo.jpg",
      mime_type: "image/jpeg",
      size: 120456,
    });
    expect(result.success).toBe(true);
  });

  it("should accept numeric id", () => {
    const result = MediaSchema.safeParse({
      id: 42,
      url: "https://cdn.example.com/doc.pdf",
      name: "doc.pdf",
      mime_type: "application/pdf",
      size: 5000,
    });
    expect(result.success).toBe(true);
  });
});

describe("ImageSchema", () => {
  it("should validate an image object", () => {
    const result = ImageSchema.safeParse({
      url: "https://cdn.example.com/hero.jpg",
      alt: "Hero Banner",
    });
    expect(result.success).toBe(true);
  });

  it("should allow optional thumb_url and alt", () => {
    const result = ImageSchema.safeParse({
      url: "https://cdn.example.com/hero.jpg",
    });
    expect(result.success).toBe(true);
  });
});
