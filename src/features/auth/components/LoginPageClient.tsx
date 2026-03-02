"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff, Loader2, ArrowRight, Mail } from "lucide-react";
import { SocialSignInButtons } from "./SocialSignInButtons";
import { OtpInput } from "@/components/ui";
import type { SocialProviderConfig } from "../mocks/auth";
import {
  loginUser,
  verifyOtp,
  resendOtp,
  OTP_TYPE,
  getAuthErrorMessage,
} from "../services/auth-service";

type LoginStep = "credentials" | "verification";

interface LoginPageClientProps {
  socialProviders: SocialProviderConfig[];
}

/**
 * Client shell for the login page.
 * Manages the multi-step flow: credentials → OTP verification.
 * Uses real backend API.
 */
function LoginPageClient({ socialProviders }: LoginPageClientProps) {
  const router = useRouter();

  // Step management
  const [step, setStep] = useState<LoginStep>("credentials");
  const [identifier, setIdentifier] = useState("");
  const [expiresIn, setExpiresIn] = useState(0);

  // Form state
  const [loginField, setLoginField] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [otpError, setOtpError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [successMessage, setSuccessMessage] = useState("");

  // ─── Login Submit ──────────────────────────────────────────
  const handleLogin = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError("");

      if (!loginField.trim()) {
        setError("Entrez votre email ou numéro de téléphone");
        return;
      }
      if (!password.trim()) {
        setError("Entrez votre mot de passe");
        return;
      }

      setLoading(true);
      try {
        const result = await loginUser({
          login_field: loginField.trim(),
          password,
        });

        if (result.type === "otp_required") {
          setIdentifier(result.identifier);
          setExpiresIn(result.expires_in);
          setStep("verification");
        } else {
          // Login success — store token and redirect
          if (typeof window !== "undefined" && result.token) {
            document.cookie = `auth_token=${result.token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
          }
          router.push("/");
          router.refresh();
        }
      } catch (err) {
        setError(getAuthErrorMessage(err));
      } finally {
        setLoading(false);
      }
    },
    [loginField, password, router]
  );

  // ─── OTP Verify ────────────────────────────────────────────
  const handleVerify = useCallback(
    async (code: string) => {
      setOtpError("");
      setLoading(true);
      try {
        const result = await verifyOtp({
          identifier,
          code,
          type: OTP_TYPE.LOGIN_VERIFICATION,
        });

        if (result.token) {
          if (typeof window !== "undefined") {
            document.cookie = `auth_token=${result.token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
          }
          router.push("/");
          router.refresh();
        }
      } catch (err) {
        setOtpError(getAuthErrorMessage(err));
      } finally {
        setLoading(false);
      }
    },
    [identifier, router]
  );

  // ─── Resend OTP ────────────────────────────────────────────
  const handleResend = useCallback(async () => {
    if (resendCooldown > 0) return;
    setOtpError("");
    try {
      const result = await resendOtp({
        identifier,
        type: OTP_TYPE.LOGIN_VERIFICATION,
      });
      setExpiresIn(result.expires_in);
      setSuccessMessage("Code renvoyé avec succès !");
      setTimeout(() => setSuccessMessage(""), 3000);

      // Start cooldown
      setResendCooldown(60);
      const timer = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      setOtpError(getAuthErrorMessage(err));
    }
  }, [identifier, resendCooldown]);

  const handleBack = useCallback(() => {
    setStep("credentials");
    setOtpError("");
    setSuccessMessage("");
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

        <div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            Vérification
          </h1>

          <div className="mt-3 rounded-xl border border-border bg-muted/50 px-4 py-3">
            <p className="text-sm text-muted-foreground">
              Nous avons envoyé un code à 6 chiffres à
            </p>
            <p className="mt-0.5 text-sm font-semibold text-foreground">
              {identifier}
            </p>
            {expiresIn > 0 && (
              <p className="mt-1 text-xs text-muted-foreground">
                Expire dans {Math.floor(expiresIn / 60)} min
              </p>
            )}
          </div>
        </div>

        {/* OTP Input */}
        <div className="mt-8 flex justify-start">
          <OtpInput
            length={6}
            onChange={() => setOtpError("")}
            onComplete={handleVerify}
            error={!!otpError}
            disabled={loading}
          />
        </div>

        {/* Error */}
        {otpError && (
          <p className="text-xs text-error" role="alert">
            {otpError}
          </p>
        )}

        {/* Success */}
        {successMessage && (
          <p className="text-xs text-green-600" role="status">
            {successMessage}
          </p>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Vérification en cours...</span>
          </div>
        )}

        {/* Resend link */}
        <p className="mt-6 text-sm text-muted-foreground">
          Vous n&apos;avez pas reçu le code ?{" "}
          <button
            type="button"
            onClick={handleResend}
            disabled={resendCooldown > 0}
            className="font-semibold text-primary transition-colors hover:text-primary-dark hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {resendCooldown > 0
              ? `Renvoyer (${resendCooldown}s)`
              : "Renvoyer le code"}
          </button>
        </p>
      </div>
    );
  }

  // ─── Credentials Step ──────────────────────────────────────
  return (
    <div className="page-enter space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold text-foreground sm:text-4xl">
          Connexion
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Connectez-vous à votre compte Sugu
        </p>
      </div>

      {/* Login form */}
      <form onSubmit={handleLogin} className="space-y-5" noValidate>
        {/* Email / Phone field */}
        <div className="space-y-1.5">
          <label
            htmlFor="login-field"
            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"
          >
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
            Email ou téléphone
          </label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="login-field"
              type="text"
              value={loginField}
              onChange={(e) => {
                setLoginField(e.target.value);
                if (error) setError("");
              }}
              placeholder="votre@email.com ou +226..."
              autoComplete="email"
              className="h-12 w-full rounded-xl border border-border bg-background pl-11 pr-4 text-sm text-foreground transition-all duration-200 placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        {/* Password field */}
        <div className="space-y-1.5">
          <label
            htmlFor="login-password"
            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"
          >
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
            Mot de passe
          </label>
          <div className="relative">
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError("");
              }}
              placeholder="••••••••"
              autoComplete="current-password"
              className="h-12 w-full rounded-xl border border-border bg-background px-4 pr-12 text-sm text-foreground transition-all duration-200 placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Forgot password link */}
        <div className="flex justify-end">
          <Link
            href="/forgot-password"
            className="text-xs font-medium text-primary transition-colors hover:text-primary-dark hover:underline"
          >
            Mot de passe oublié ?
          </Link>
        </div>

        {/* Error message */}
        {error && (
          <p id="login-error" className="text-xs text-error" role="alert">
            {error}
          </p>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={loading}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-primary-dark active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Connexion...</span>
            </>
          ) : (
            <>
              <span>Se connecter</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-background px-4 text-muted-foreground">Ou</span>
        </div>
      </div>

      {/* Social sign-in */}
      <SocialSignInButtons providers={socialProviders} />

      {/* Sign up link */}
      <p className="text-center text-sm text-muted-foreground">
        Pas encore de compte ?{" "}
        <Link
          href="/register"
          className="font-semibold text-primary transition-colors hover:text-primary-dark hover:underline"
        >
          Créer un compte
        </Link>
      </p>
    </div>
  );
}

export { LoginPageClient };
