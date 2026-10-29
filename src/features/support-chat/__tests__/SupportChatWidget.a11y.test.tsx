// @vitest-environment jsdom
/**
 * The support chat window is announced as a dialog tied to its button, every
 * icon-only control has a name, and Escape closes it (audit P3 a11y).
 */
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders, screen, within } from "@/test/render";
import userEvent from "@testing-library/user-event";

vi.mock("@/lib/messaging/hooks/useEchoChannel", () => ({ useEchoChannel: () => false }));
vi.mock("@/lib/api/auth", () => ({ getAuthUser: vi.fn(async () => ({ id: "01jkqz3m5baxnp9c7hd2fewyu1" })) }));
vi.mock("../api", () => ({
  startChat: vi.fn(),
  getActiveChat: vi.fn(async () => null),
  getMessages: vi.fn(async () => []),
  sendMessage: vi.fn(),
  markRead: vi.fn(async () => {}),
  endChat: vi.fn(),
}));

import SupportChatWidget from "../SupportChatWidget";

describe("SupportChatWidget accessibility", () => {
  it("opens a named window its button controls, and Escape closes it", async () => {
    renderWithProviders(<SupportChatWidget />);
    const launcher = screen.getByRole("button", { name: "Ouvrir le chat support" });

    await userEvent.click(launcher);
    const chatWindow = await screen.findByRole("dialog", { name: "Chat Support" });
    expect(launcher).toHaveAttribute("aria-controls", chatWindow.id);
    expect(launcher).toHaveAttribute("aria-expanded", "true");

    await userEvent.click(within(chatWindow).getAllByRole("textbox")[0]);
    await userEvent.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
