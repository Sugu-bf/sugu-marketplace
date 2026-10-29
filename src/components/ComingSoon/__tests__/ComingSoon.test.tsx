/**
 * @vitest-environment jsdom
 *
 * The pre-launch page only shows what is configured: no WhatsApp link to "#"
 * when the channel is not set (audit P1-13).
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
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
});
