/**
 * @vitest-environment jsdom
 *
 * Keyboard behaviour of the custom modal overlays (audit P3 a11y): focus goes
 * in, stays in, Escape closes, focus comes back.
 */
import { describe, it, expect } from "vitest";
import { useRef, useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useModalDialog } from "@/lib/a11y/use-modal-dialog";

function Harness({ withInitialFocus = false }: { withInitialFocus?: boolean }) {
  const [open, setOpen] = useState(false);
  const fieldRef = useRef<HTMLInputElement>(null);
  const dialogRef = useModalDialog<HTMLDivElement>(open, () => setOpen(false), withInitialFocus ? fieldRef : undefined);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Ouvrir
      </button>
      <button type="button">Derrière</button>
      {open && (
        <div ref={dialogRef} role="dialog" aria-modal="true" aria-label="Recherche">
          <button type="button">Premier</button>
          <input ref={fieldRef} aria-label="Champ" />
          <button type="button" onClick={() => setOpen(false)}>
            Dernier
          </button>
        </div>
      )}
    </>
  );
}

describe("useModalDialog", () => {
  it("moves focus into the dialog, to the first control by default", async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole("button", { name: "Ouvrir" }));

    expect(screen.getByRole("button", { name: "Premier" })).toHaveFocus();
  });

  it("moves focus to the requested control", async () => {
    render(<Harness withInitialFocus />);
    await userEvent.click(screen.getByRole("button", { name: "Ouvrir" }));

    expect(screen.getByRole("textbox", { name: "Champ" })).toHaveFocus();
  });

  it("keeps Tab and Shift+Tab inside the dialog", async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole("button", { name: "Ouvrir" }));

    await userEvent.tab({ shift: true });
    expect(screen.getByRole("button", { name: "Dernier" })).toHaveFocus();

    await userEvent.tab();
    expect(screen.getByRole("button", { name: "Premier" })).toHaveFocus();
  });

  it("closes on Escape and gives focus back to what opened it", async () => {
    render(<Harness />);
    const opener = screen.getByRole("button", { name: "Ouvrir" });
    await userEvent.click(opener);

    await userEvent.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
  });
});
