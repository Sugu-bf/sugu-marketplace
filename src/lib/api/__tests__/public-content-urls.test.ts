/**
 * P0-16 (audit 2026-10-29): blog, CMS pages, FAQ and branding called
 * `${API_BASE_URL}/v1/...`, a path Laravel does not serve (its routes live
 * under /api): the blog was empty, posts and pages answered 404 while listed
 * in the sitemap, the FAQ was empty and the branding never applied.
 *
 * Each of them now goes through publicUrl() (/api/v1/public/...), with a
 * timeout; a post or page is "not found" only on a 404 of the API.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { API_BASE_URL } from "@/lib/api/config";
import { queryFaqItems } from "@/features/faq/queries/faq-queries";
import { fetchBranding } from "@/lib/branding.service";
import { generateMetadata as blogPostMetadata } from "@/app/(main)/blog/[slug]/page";
import { generateMetadata as cmsPageMetadata } from "@/app/(main)/pages/[slug]/page";

const fetchMock = vi.fn();

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

function calledUrl(): string {
  return String(fetchMock.mock.calls[0][0]);
}

function calledInit(): RequestInit {
  return fetchMock.mock.calls[0][1] as RequestInit;
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("public content URLs", () => {
  it("fetches the FAQ under /api/v1/public, with a timeout", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ faqs: [] }));

    await queryFaqItems("livraison");

    expect(calledUrl()).toBe(`${API_BASE_URL}/api/v1/public/help/faqs?category=livraison`);
    expect(calledInit().signal).toBeInstanceOf(AbortSignal);
  });

  it("fetches the branding under /api/v1/public, with a timeout", async () => {
    fetchMock.mockResolvedValue(jsonResponse({}));

    await fetchBranding();

    expect(calledUrl()).toBe(`${API_BASE_URL}/api/v1/public/marketplace-config`);
    expect(calledInit().signal).toBeInstanceOf(AbortSignal);
  });

  it("fetches a blog post under /api/v1/public, slug encoded", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ message: "Not found" }, 404));

    const metadata = await blogPostMetadata({ params: Promise.resolve({ slug: "a/../b" }) });

    expect(calledUrl()).toBe(`${API_BASE_URL}/api/v1/public/blog/posts/a%2F..%2Fb`);
    expect(metadata.title).toBe("Article introuvable");
  });

  it("fetches a CMS page under /api/v1/public", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ message: "Not found" }, 404));

    const metadata = await cmsPageMetadata({ params: Promise.resolve({ slug: "cgv" }) });

    expect(calledUrl()).toBe(`${API_BASE_URL}/api/v1/public/pages/cgv`);
    expect(metadata.title).toBe("Page introuvable");
  });

  it("does not turn an outage of the API into a missing post or page", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ message: "Server Error" }, 503));

    await expect(blogPostMetadata({ params: Promise.resolve({ slug: "x" }) })).rejects.toThrow();
    await expect(cmsPageMetadata({ params: Promise.resolve({ slug: "x" }) })).rejects.toThrow();
  });
});
