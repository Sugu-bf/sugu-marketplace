/**
 * @vitest-environment jsdom
 *
 * Consent and Meta Pixel (audit M8): nothing loads or measures before the
 * visitor accepts, refusing is as easy as accepting, the choice is kept and
 * can be changed, and checkout is never measured.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { readConsent, writeConsent } from "@/features/consent/consent";
import { __resetMetaPixel, isTrackedRoute, trackPixel } from "@/features/consent/meta-pixel";
import { ConsentBanner, ConsentPreferencesButton } from "@/features/consent/components/ConsentBanner";
import { MetaPixelPageViews } from "@/features/consent/components/MetaPixelPageViews";

let pathname = "/";
vi.mock("next/navigation", () => ({ usePathname: () => pathname }));

type QueuedFbq = { queue: unknown[][] };

function pixelScripts() {
  return document.querySelectorAll('script[src="https://connect.facebook.net/en_US/fbevents.js"]');
}

function sentToPixel(): unknown[][] {
  return window.fbq ? (window.fbq as unknown as QueuedFbq).queue.map((args) => Array.from(args)) : [];
}

beforeEach(() => {
  localStorage.clear();
  pathname = "/";
  vi.stubEnv("NEXT_PUBLIC_META_PIXEL_ID", "1234567890");
  __resetMetaPixel();
  document.head.innerHTML = "";
  Reflect.deleteProperty(window, "fbq");
  Reflect.deleteProperty(window, "_fbq");
});

afterEach(() => vi.unstubAllEnvs());

describe("meta pixel", () => {
  it("loads nothing and sends nothing before consent", () => {
    trackPixel("PageView");

    expect(pixelScripts()).toHaveLength(0);
    expect(window.fbq).toBeUndefined();
  });

  it("loads once after consent, without Meta's automatic collection", () => {
    writeConsent("granted");

    trackPixel("PageView");
    trackPixel("ViewContent", { content_ids: ["42"] });

    expect(pixelScripts()).toHaveLength(1);
    expect(sentToPixel()).toEqual([
      ["set", "autoConfig", false, "1234567890"],
      ["init", "1234567890"],
      ["consent", "grant"],
      ["track", "PageView"],
      ["track", "ViewContent", { content_ids: ["42"] }],
    ]);
    expect((window.fbq as unknown as { disablePushState: boolean }).disablePushState).toBe(true);
  });

  it("does nothing without a pixel id", () => {
    vi.stubEnv("NEXT_PUBLIC_META_PIXEL_ID", "");
    writeConsent("granted");

    trackPixel("PageView");

    expect(pixelScripts()).toHaveLength(0);
  });

  it("never measures checkout or the payment returns", () => {
    expect(isTrackedRoute("/product/x")).toBe(true);
    expect(isTrackedRoute("/checkout")).toBe(false);
    expect(isTrackedRoute("/payments/success")).toBe(false);
    expect(isTrackedRoute("/checkouts-guide")).toBe(true);
  });
});

describe("ConsentBanner", () => {
  it("asks until the visitor refuses, and loads nothing then", async () => {
    render(<ConsentBanner />);

    const banner = screen.getByRole("region", { name: "Mesure d'audience" });
    expect(banner).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Refuser" }));

    expect(screen.queryByRole("region", { name: "Mesure d'audience" })).not.toBeInTheDocument();
    expect(readConsent()).toBe("denied");
    expect(pixelScripts()).toHaveLength(0);
  });

  it("keeps an accepted choice and can be asked again from the footer", async () => {
    render(
      <>
        <ConsentBanner />
        <ConsentPreferencesButton />
      </>,
    );

    await userEvent.click(screen.getByRole("button", { name: "Accepter" }));
    expect(readConsent()).toBe("granted");
    expect(screen.queryByRole("region")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Gérer la mesure d'audience" }));
    expect(readConsent()).toBe("unset");
    expect(screen.getByRole("region", { name: "Mesure d'audience" })).toBeInTheDocument();
  });

  it("revokes a pixel already loaded on the page when consent is withdrawn", async () => {
    writeConsent("granted");
    trackPixel("PageView");
    render(<ConsentPreferencesButton />);

    await userEvent.click(screen.getByRole("button", { name: "Gérer la mesure d'audience" }));

    expect(sentToPixel().at(-1)).toEqual(["consent", "revoke"]);
  });
});

describe("MetaPixelPageViews", () => {
  it("sends one PageView per route once consent is given, none on checkout", () => {
    const { rerender } = render(<MetaPixelPageViews />);
    expect(window.fbq).toBeUndefined();

    act(() => writeConsent("granted"));
    pathname = "/category/fruits";
    rerender(<MetaPixelPageViews />);
    pathname = "/checkout";
    rerender(<MetaPixelPageViews />);

    const pageViews = sentToPixel().filter(([kind, event]) => kind === "track" && event === "PageView");
    expect(pageViews).toHaveLength(2);
  });
});
