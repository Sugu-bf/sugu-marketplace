"use client";

import { useState, useRef, useEffect, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface DropdownProps {
  trigger: ReactNode;
  children: ReactNode;
  align?: "left" | "right";
  className?: string;
}

function Dropdown({ trigger, children, align = "left", className }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative inline-block">
      <div
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => e.key === "Enter" && setOpen((v) => !v)}
        role="button"
        tabIndex={0}
        aria-expanded={open}
        aria-haspopup="true"
      >
        {trigger}
      </div>

      {open && (
        <div
          className={cn(
            "absolute z-50 mt-2 min-w-[180px] rounded-xl border border-border-light bg-background p-1.5 shadow-xl animate-fade-slide-down",
            align === "right" ? "right-0" : "left-0",
            className
          )}
          role="menu"
        >
          {children}
        </div>
      )}
    </div>
  );
}

interface DropdownItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

function DropdownItem({ className, active, ...props }: DropdownItemProps) {
  return (
    <button
      role="menuitem"
      className={cn(
        "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted hover:text-primary",
        active && "bg-primary-50 text-primary font-medium",
        className
      )}
      {...props}
    />
  );
}

export { Dropdown, DropdownItem };
