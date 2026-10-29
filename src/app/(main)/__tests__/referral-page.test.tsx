// @vitest-environment jsdom
/**
 * Referral rewards do not exist yet (no referral is recorded, no reward is
 * paid, the share link `sugu.pro/r/{code}` has no page). The page says the
 * programme is coming, and shows no code, figure, reward or link.
 */
import { describe, expect, it } from "vitest";
import { render, screen } from "@/test/render";
import ReferralPage from "../account/referral/page";

describe("referral page", () => {
  it("says the programme is coming, and promises nothing", () => {
    const { container } = render(<ReferralPage />);

    expect(screen.getByText("Bientôt disponible")).toBeInTheDocument();
    const text = container.textContent ?? "";
    expect(text).not.toMatch(/FCFA|Total gagné|Par parrainage|Gagnez|code de parrainage/i);
    expect(container.querySelector("a[href*='/r/']")).toBeNull();
    expect(screen.queryByRole("button", { name: /Copier|Partager/ })).toBeNull();
  });
});
