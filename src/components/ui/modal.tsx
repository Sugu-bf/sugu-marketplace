"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  className?: string;
  /** Max width of the modal panel */
  size?: "sm" | "md" | "lg" | "xl" | "full";
}

const sizeMap = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  full: "max-w-3xl",
} as const;

function Modal({ open, onClose, children, title, className, size = "md" }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [open]);

  // Close on Escape is handled natively by <dialog>
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === dialogRef.current) onClose();
  };

  if (!open) return null;

  return (
    <dialog
      ref={dialogRef}
      className={cn(
        "fixed inset-0 z-[100] m-auto rounded-2xl border-none bg-background p-0 shadow-xl backdrop:bg-black/40 backdrop:backdrop-blur-sm",
        "animate-scale-in",
        sizeMap[size],
        className
      )}
      onClose={onClose}
      onClick={handleBackdropClick}
    >
      <div className="flex flex-col">
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between border-b border-border-light px-6 py-4">
            <h2 className="text-lg font-bold text-foreground">{title}</h2>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Fermer"
            >
              <X size={18} />
            </button>
          </div>
        )}
        {/* Body */}
        <div className="p-6">{children}</div>
      </div>
    </dialog>
  );
}

export { Modal };
