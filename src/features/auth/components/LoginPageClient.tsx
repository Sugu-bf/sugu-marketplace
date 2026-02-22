"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LoginForm } from "./LoginForm";
import { SocialSignInButtons } from "./SocialSignInButtons";
import { VerificationForm } from "./VerificationForm";
import type { CountryCode, AuthMethod } from "../models/auth";
import type { SocialProviderConfig } from "../mocks/auth";

type LoginStep = "credentials" | "verification";

interface LoginPageClientProps {
  countryCodes: CountryCode[];
  defaultCountryCode: CountryCode;
  socialProviders: SocialProviderConfig[];
}

/**
 * Client shell for the login page.
 * Manages the multi-step flow: credentials → verification.
 */
function LoginPageClient({
  countryCodes,
  defaultCountryCode,
  socialProviders,
}: LoginPageClientProps) {
  const [step, setStep] = useState<LoginStep>("credentials");
  const [authMethod, setAuthMethod] = useState<AuthMethod>("phone");
  const [destination, setDestination] = useState("");

  const handleLoginSubmit = useCallback(
    (method: AuthMethod, value: string) => {
      setAuthMethod(method);
      setDestination(value);
      setStep("verification");
    },
    []
  );

  const handleBack = useCallback(() => {
    setStep("credentials");
  }, []);

  const handleVerify = useCallback((code: string) => {
    // Design-only: no API call
    console.log("OTP submitted:", code);
  }, []);

  const handleResend = useCallback(() => {
    // Design-only: no API call
    console.log("Resend OTP requested");
  }, []);

  // ─── Verification Step ─────────────────────────────────────
  if (step === "verification") {
    return (
      <div className="page-enter space-y-6">
        {/* Back button */}
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-lg p-1"
          aria-label="Retour à la connexion"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <VerificationForm
          method={authMethod}
          destination={destination}
          onVerify={handleVerify}
          onResend={handleResend}
        />
      </div>
    );
  }

  // ─── Credentials Step ──────────────────────────────────────
  return (
    <div className="page-enter space-y-8">
      {/* Title */}
      <h1 className="text-3xl font-bold text-foreground sm:text-4xl">Login</h1>

      {/* Login form */}
      <LoginForm
        countryCodes={countryCodes}
        defaultCountryCode={defaultCountryCode}
        onSubmit={handleLoginSubmit}
      />

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-background px-4 text-muted-foreground">Or</span>
        </div>
      </div>

      {/* Social sign-in */}
      <SocialSignInButtons providers={socialProviders} />

      {/* Sign up link */}
      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link
          href="/onboarding"
          className="font-semibold text-primary transition-colors hover:text-primary-dark hover:underline"
        >
          Sign Up
        </Link>
      </p>
    </div>
  );
}

export { LoginPageClient };
