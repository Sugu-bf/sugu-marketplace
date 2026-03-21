"use client";

import {
  useRef,
  useState,
  useCallback,
  type KeyboardEvent,
  type ClipboardEvent,
  type ChangeEvent,
} from "react";
import { cn } from "@/lib/utils";

interface OtpInputProps {
  /** Number of OTP digits */
  length?: number;
  /** Callback when all digits are filled */
  onComplete?: (code: string) => void;
  /** Callback on any change */
  onChange?: (code: string) => void;
  /** Error state */
  error?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Additional class on the wrapper */
  className?: string;
  /** Unique id prefix for accessibility */
  id?: string;
}

/**
 * OTP digit input — reusable across verification flows.
 * Auto-advances focus, supports paste, backspace navigation.
 */
function OtpInput({
  length = 4,
  onComplete,
  onChange,
  error = false,
  disabled = false,
  className,
  id = "otp",
}: OtpInputProps) {
  const [values, setValues] = useState<string[]>(Array(length).fill(""));
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const focusInput = useCallback(
    (index: number) => {
      if (index >= 0 && index < length) {
        inputsRef.current[index]?.focus();
      }
    },
    [length]
  );

  const updateValues = useCallback(
    (newValues: string[]) => {
      setValues(newValues);
      const code = newValues.join("");
      onChange?.(code);
      // BUG FIX : !code.includes("") est toujours false en JS
      // car "".includes("") === true (chaîne vide incluse dans toute string)
      // → onComplete ne se déclenchait JAMAIS
      // Fix : vérifier que chaque case individuelle est non-vide
      if (newValues.length === length && newValues.every((v) => v !== "")) {
        onComplete?.(code);
      }
    },
    [length, onChange, onComplete]
  );

  const handleChange = useCallback(
    (index: number) => (e: ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      // Only accept single digit
      if (val && !/^\d$/.test(val)) return;

      const newValues = [...values];
      newValues[index] = val;
      updateValues(newValues);

      // Auto-advance
      if (val && index < length - 1) {
        focusInput(index + 1);
      }
    },
    [values, length, focusInput, updateValues]
  );

  const handleKeyDown = useCallback(
    (index: number) => (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace") {
        if (values[index]) {
          const newValues = [...values];
          newValues[index] = "";
          updateValues(newValues);
        } else if (index > 0) {
          focusInput(index - 1);
          const newValues = [...values];
          newValues[index - 1] = "";
          updateValues(newValues);
        }
      } else if (e.key === "ArrowLeft" && index > 0) {
        focusInput(index - 1);
      } else if (e.key === "ArrowRight" && index < length - 1) {
        focusInput(index + 1);
      }
    },
    [values, length, focusInput, updateValues]
  );

  const handlePaste = useCallback(
    (e: ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pasted = e.clipboardData
        .getData("text")
        .replace(/\D/g, "")
        .slice(0, length);
      if (!pasted) return;

      const newValues = [...values];
      for (let i = 0; i < pasted.length; i++) {
        newValues[i] = pasted[i];
      }
      updateValues(newValues);
      focusInput(Math.min(pasted.length, length - 1));
    },
    [values, length, focusInput, updateValues]
  );

  return (
    <div
      className={cn("flex items-center gap-3 sm:gap-4", className)}
      role="group"
      aria-label="Code de vérification"
    >
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => {
            inputsRef.current[i] = el;
          }}
          id={`${id}-${i}`}
          type="text"
          inputMode="numeric"
          maxLength={1}
          autoComplete="one-time-code"
          value={values[i]}
          onChange={handleChange(i)}
          onKeyDown={handleKeyDown(i)}
          onPaste={i === 0 ? handlePaste : undefined}
          disabled={disabled}
          aria-label={`Chiffre ${i + 1}`}
          className={cn(
            "h-14 w-14 sm:h-16 sm:w-16 rounded-xl border-2 bg-background text-center text-2xl font-semibold text-foreground transition-all duration-200",
            "placeholder:text-muted-foreground/40",
            "focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error
              ? "border-error focus:border-error focus:ring-error/20"
              : "border-border hover:border-muted-foreground/30"
          )}
          placeholder="0"
        />
      ))}
    </div>
  );
}

export { OtpInput };
export type { OtpInputProps };
