"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import { AuthMethodTabs } from "./AuthMethodTabs";
import { CountryCodeSelector } from "./CountryCodeSelector";
import type { AuthMethod, CountryCode } from "../models/auth";

interface LoginFormProps {
  countryCodes: CountryCode[];
  defaultCountryCode: CountryCode;
  /** Called when the form is submitted — triggers navigation to verification */
  onSubmit?: (method: AuthMethod, value: string) => void;
  className?: string;
}

/**
 * Login form with Email/Phone tabs.
 * Client component due to tab switching + form state.
 */
function LoginForm({
  countryCodes,
  defaultCountryCode,
  onSubmit,
  className,
}: LoginFormProps) {
  const [method, setMethod] = useState<AuthMethod>("phone");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedCountry, setSelectedCountry] =
    useState<CountryCode>(defaultCountryCode);
  const [error, setError] = useState("");

  const handleMethodChange = (newMethod: AuthMethod) => {
    setMethod(newMethod);
    setError("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (method === "email") {
      if (!email.trim()) {
        setError("Entrer votre email");
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setError("Entrer un email valide");
        return;
      }
      onSubmit?.(method, email);
    } else {
      if (!phone.trim()) {
        setError("Entrer votre numero de telephone");
        return;
      }
      onSubmit?.(method, `${selectedCountry.dialCode} ${phone}`);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("space-y-6", className)}
      noValidate
    >
      {/* Method tabs */}
      <AuthMethodTabs activeMethod={method} onMethodChange={handleMethodChange} />

      {/* Tab panels — key forces remount for proper animation */}
      {method === "email" ? (
        <div
          key="email"
          id="panel-email"
          role="tabpanel"
          aria-labelledby="tab-email"
          className="animate-fade-slide-up"
          style={{ animationDuration: "0.3s" }}
        >
          <div className="space-y-1.5">
            <label
              htmlFor="login-email"
              className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"
            >
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
              Email address
            </label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError("");
              }}
              placeholder="your@email.com"
              autoComplete="email"
              aria-invalid={!!error && method === "email"}
              aria-describedby={error && method === "email" ? "login-error" : undefined}
              className={cn(
                "h-12 w-full rounded-xl border bg-background px-4 text-sm text-foreground transition-all duration-200 placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20",
                error && method === "email" ? "border-error" : "border-border"
              )}
            />
          </div>
        </div>
      ) : (
        <div
          key="phone"
          id="panel-phone"
          role="tabpanel"
          aria-labelledby="tab-phone"
          className="animate-fade-slide-up"
          style={{ animationDuration: "0.3s" }}
        >
          <div className="space-y-1.5">
            <label
              htmlFor="login-phone"
              className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"
            >
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
              Phone number
            </label>
            <div
              className={cn(
                "flex items-center gap-2 rounded-xl border px-2 transition-all duration-200 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20",
                error && method === "phone" ? "border-error" : "border-border"
              )}
            >
              <CountryCodeSelector
                countryCodes={countryCodes}
                value={selectedCountry}
                onChange={setSelectedCountry}
              />
              <input
                id="login-phone"
                type="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (error) setError("");
                }}
                placeholder="+1 (555) 000-0545"
                autoComplete="tel"
                aria-invalid={!!error && method === "phone"}
                aria-describedby={error && method === "phone" ? "login-error" : undefined}
                className="h-12 flex-1 border-none bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
            </div>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <p id="login-error" className="text-xs text-error" role="alert">
          {error}
        </p>
      )}

      {/* Submit button */}
      <button
        type="submit"
        className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-primary-dark active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        <span>Continue</span>
        <ArrowRight className="h-4 w-4" />
      </button>
    </form>
  );
}

export { LoginForm };
