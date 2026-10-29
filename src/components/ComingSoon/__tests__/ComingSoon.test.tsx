/**
 * @vitest-environment jsdom
 *
 * The pre-launch page only shows what is configured: no WhatsApp link to "#"
 * when the channel is not set (audit P1-13), loads no third party by itself
 * (M8), and its seller form is a real modal dialog (P3 a11y).
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ComingSoon } from "@/components/ComingSoon";

afterEach(() => vi.unstubAllEnvs());

function whatsappLink() {
  return screen.queryByText("Canal VIP")?.closest("a") ?? null;
}

describe("ComingSoon", () => {
  it("links the WhatsApp channel when it is configured", () => {
    vi.stubEnv("NEXT_PUBLIC_WHATSAPP_CHANNEL_URL", "https://whatsapp.com/channel/abc");

    render(<ComingSoon />);

    expect(whatsappLink()).toHaveAttribute("href", "https://whatsapp.com/channel/abc");
  });

  it("shows no WhatsApp link when the channel is not configured", () => {
    vi.stubEnv("NEXT_PUBLIC_WHATSAPP_CHANNEL_URL", "");

    render(<ComingSoon />);

    expect(whatsappLink()).toBeNull();
  });

  it("loads neither Google Fonts nor the Meta Pixel by itself (audit M8)", () => {
    vi.stubEnv("NEXT_PUBLIC_META_PIXEL_ID", "1234567890");

    const { container } = render(<ComingSoon />);

    expect(document.querySelector('link[href*="fonts.googleapis.com"]')).toBeNull();
    expect(container.querySelector("script")).toBeNull();
    expect(window.fbq).toBeUndefined();
  });

  it("opens the seller form as a modal dialog that Escape closes", async () => {
    render(<ComingSoon />);
    const opener = screen.getByRole("button", { name: "Être contacté" });

    await userEvent.click(opener);
    const dialog = screen.getByRole("dialog", { name: "Portail B2B : Grossistes" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toContainElement(document.activeElement as HTMLElement);

    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
  });
});
