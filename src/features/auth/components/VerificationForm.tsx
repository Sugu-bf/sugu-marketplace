"use client";

import { useState } from "react";
import { OtpInput } from "@/components/ui";
import type { AuthMethod } from "../models/auth";

interface VerificationFormProps {
  method: AuthMethod;
  destination: string;
  /** Called when OTP is fully entered */
  onVerify?: (code: string) => void;
  /** Called when the user clicks "Request a New Code" */
  onResend?: () => void;
  className?: string;
}

/**
 * OTP verification form — displayed after login form submission.
 * Shows the destination (email or phone) and a 4-digit OTP input.
 */
function VerificationForm({
  method,
  destination,
  onVerify,
  onResend,
  className,
}: VerificationFormProps) {
  const [code, setCode] = useState("");

  const title =
    method === "email" ? "Check your email" : "Enter verification code";

  return (
    <div className={className}>
      {/* Title */}
      <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
        {title}
      </h1>

      {/* Subtitle */}
      <div className="mt-3 rounded-xl border border-border bg-muted/50 px-4 py-3">
        <p className="text-sm text-muted-foreground">
          We sent a 6-digit code to
        </p>
        <p className="mt-0.5 text-sm font-semibold text-foreground">
          {destination}
        </p>
      </div>

      {/* OTP Input */}
      <div className="mt-8 flex justify-start">
        <OtpInput
          length={4}
          onChange={setCode}
          onComplete={(c) => onVerify?.(c)}
        />
      </div>

      {/* Resend link */}
      <p className="mt-6 text-sm text-muted-foreground">
        Haven&apos;t received your code?{" "}
        <button
          type="button"
          onClick={onResend}
          className="font-semibold text-primary transition-colors hover:text-primary-dark hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          Request a New Code
        </button>
      </p>
    </div>
  );
}

export { VerificationForm };
