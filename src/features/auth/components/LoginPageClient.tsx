"use client";

import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff, Loader2, ArrowRight, Mail, Phone, Lock } from "lucide-react";
import { OtpInput } from "@/components/ui";
import { CountryCodeSelector } from "./CountryCodeSelector";
import { GoogleSignInButton } from "./GoogleSignInButton";
import {
  loginUser,
  verifyOtp,
  resendOtp,
  OTP_TYPE,
  getAuthErrorMessage,
} from "../services/auth-service";
import { mockCountryCodes } from "../mocks/auth";
import type { SocialProviderConfig } from "../mocks/auth";
import type { CountryCode } from "../models/auth";

type LoginMethod = "phone" | "email";
type LoginStep = "credentials" | "verification";

interface LoginPageClientProps {
  socialProviders: SocialProviderConfig[];
}

function setAuthCookie(token: string): void {
  if (typeof document === "undefined") return;
  const isHttps = window.location.protocol === "https:";
  const secure = isHttps ? "; Secure" : "";
  document.cookie = `auth_token=${encodeURIComponent(token)}; path=/; max-age=${
    60 * 60 * 24 * 7
  }; SameSite=Lax${secure}`;
}

function LoginPageClient({ socialProviders: _ }: LoginPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "/";
  const safeRedirect = redirectTo.startsWith("/") ? redirectTo : "/";

  // ─── Method switch ─────────────────────────────────────────
  const [method, setMethod] = useState<LoginMethod>("phone");

  // ─── Steps ────────────────────────────────────────────────
  const [step, setStep] = useState<LoginStep>("credentials");
  const [otpIdentifier, setOtpIdentifier] = useState("");
  const [otpExpiresIn, setOtpExpiresIn] = useState(0);

  // ─── Fields ───────────────────────────────────────────────
  const [phone, setPhone] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(
    mockCountryCodes.find((c) => c.code === "BF") ?? mockCountryCodes[0]
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // ─── UI ───────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [otpError, setOtpError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [successMsg, setSuccessMsg] = useState("");

  // ─── Format phone → E.164 ─────────────────────────────────
  const formatPhoneE164 = (raw: string): string => {
    const cleaned = raw.replace(/[\s\-(). ]/g, "");
    return cleaned.startsWith("+") ? cleaned : `${selectedCountry.dialCode}${cleaned}`;
  };

  // ─── Login Submit ──────────────────────────────────────────
  const handleLogin = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError("");

      const loginField =
        method === "phone" ? formatPhoneE164(phone) : email.trim();

      if (!loginField) {
        setError(method === "phone" ? "Entrez votre numéro" : "Entrez votre email");
        return;
      }
      if (!password) {
        setError("Entrez votre mot de passe");
        return;
      }

      setLoading(true);
      try {
        const result = await loginUser({ login_field: loginField, password });

        if (result.type === "otp_required") {
          setOtpIdentifier(result.identifier);
          setOtpExpiresIn(result.expires_in);
          setStep("verification");
        } else {
          if (result.token) setAuthCookie(result.token);
          router.push(safeRedirect);
          router.refresh();
        }
      } catch (err) {
        setError(getAuthErrorMessage(err));
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [method, phone, email, password, selectedCountry, safeRedirect]
  );

  // ─── OTP Verify ────────────────────────────────────────────
  const handleVerify = useCallback(
    async (code: string) => {
      setOtpError("");
      setLoading(true);
      try {
        const result = await verifyOtp({
          identifier: otpIdentifier,
          code,
          type: OTP_TYPE.LOGIN_VERIFICATION,
        });
        if (result.token) {
          setAuthCookie(result.token);
          router.push(safeRedirect);
          router.refresh();
        }
      } catch (err) {
        setOtpError(getAuthErrorMessage(err));
      } finally {
        setLoading(false);
      }
    },
    [otpIdentifier, router, safeRedirect]
  );

  const handleResend = useCallback(async () => {
    if (resendCooldown > 0) return;
    setOtpError("");
    try {
      const result = await resendOtp({
        identifier: otpIdentifier,
        type: OTP_TYPE.LOGIN_VERIFICATION,
      });
      setOtpExpiresIn(result.expires_in);
      setSuccessMsg("Code renvoyé !");
      setTimeout(() => setSuccessMsg(""), 3000);
      setResendCooldown(60);
      const t = setInterval(() => {
        setResendCooldown((p) => {
          if (p <= 1) { clearInterval(t); return 0; }
          return p - 1;
        });
      }, 1000);
    } catch (err) {
      setOtpError(getAuthErrorMessage(err));
    }
  }, [otpIdentifier, resendCooldown]);

  // ─── OTP Step ──────────────────────────────────────────────
  if (step === "verification") {
    return (
      <div className="page-enter space-y-6">
        <button
          type="button"
          onClick={() => { setStep("credentials"); setOtpError(""); setSuccessMsg(""); }}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Retour
        </button>

        <div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Vérification</h1>
          <div className="mt-3 rounded-xl border border-border bg-muted/50 px-4 py-3">
            <p className="text-sm text-muted-foreground">Code envoyé à</p>
            <p className="mt-0.5 text-sm font-semibold text-foreground">{otpIdentifier}</p>
            {otpExpiresIn > 0 && (
              <p className="mt-1 text-xs text-muted-foreground">
                Expire dans {Math.floor(otpExpiresIn / 60)} min
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-start">
          <OtpInput length={6} onChange={() => setOtpError("")} onComplete={handleVerify} error={!!otpError} disabled={loading} />
        </div>

        {otpError && <p className="text-xs text-error" role="alert">{otpError}</p>}
        {successMsg && <p className="text-xs text-green-600" role="status">{successMsg}</p>}
        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Vérification...</span>
          </div>
        )}

        <p className="text-sm text-muted-foreground">
          Pas reçu ?{" "}
          <button type="button" onClick={handleResend} disabled={resendCooldown > 0}
            className="font-semibold text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed">
            {resendCooldown > 0 ? `Renvoyer (${resendCooldown}s)` : "Renvoyer le code"}
          </button>
        </p>
      </div>
    );
  }

  // ─── Credentials Step ──────────────────────────────────────
  return (
    <div className="page-enter space-y-6">

      <div>
        <h1 className="text-3xl font-bold text-foreground sm:text-4xl">Connexion</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Bon retour sur Sugu 👋
        </p>
      </div>

      {/* ── Tabs ────────────────────────────────────────── */}
      <div className="flex gap-2 rounded-xl border border-border bg-muted/30 p-1">
        <button
          type="button"
          onClick={() => { setMethod("phone"); setError(""); }}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all duration-200 ${
            method === "phone"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Phone className="h-4 w-4" />
          Téléphone
        </button>
        <button
          type="button"
          onClick={() => { setMethod("email"); setError(""); }}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all duration-200 ${
            method === "email"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Mail className="h-4 w-4" />
          Email
        </button>
      </div>

      {/* ── Form ────────────────────────────────────────── */}
      <form onSubmit={handleLogin} className="space-y-4" noValidate>

        {/* Téléphone ou Email */}
        {method === "phone" ? (
          <div className="space-y-1.5">
            <label htmlFor="login-phone" className="text-sm font-medium text-foreground">
              Numéro de téléphone
            </label>
            <div className="flex items-center rounded-xl border border-border bg-background transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
              <div className="flex items-center border-r border-border pl-2 pr-1">
                <CountryCodeSelector countryCodes={mockCountryCodes} value={selectedCountry} onChange={setSelectedCountry} />
                <span className="text-xs text-muted-foreground pr-2 select-none">{selectedCountry.dialCode}</span>
              </div>
              <input
                id="login-phone"
                type="tel"
                value={phone}
                onChange={(e) => { setPhone(e.target.value); if (error) setError(""); }}
                placeholder="70 00 00 00"
                autoComplete="tel-national"
                className="h-12 flex-1 border-none bg-transparent pl-3 pr-4 text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-1.5">
            <label htmlFor="login-email" className="text-sm font-medium text-foreground">
              Adresse email
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (error) setError(""); }}
                placeholder="votre@email.com"
                autoComplete="email"
                className="h-12 w-full rounded-xl border border-border bg-background pl-11 pr-4 text-sm transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
        )}

        {/* Mot de passe */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="login-password" className="text-sm font-medium text-foreground">
              Mot de passe
            </label>
            <Link href="/forgot-password" className="text-xs font-medium text-primary hover:underline">
              Oublié ?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => { setPassword(e.target.value); if (error) setError(""); }}
              placeholder="••••••••"
              autoComplete="current-password"
              className="h-12 w-full rounded-xl border border-border bg-background pl-11 pr-12 text-sm transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showPassword ? "Masquer" : "Afficher"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {error && <p id="login-error" className="text-xs text-error" role="alert">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-primary-dark active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <><Loader2 className="h-4 w-4 animate-spin" /><span>Connexion...</span></>
          ) : (
            <><span>Se connecter</span><ArrowRight className="h-4 w-4" /></>
          )}
        </button>
      </form>

      {/* ── Séparateur ──────────────────────────────────── */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-background px-4 text-muted-foreground">Ou</span>
        </div>
      </div>

      {/* ── Google Sign-In ────────────────────────────── */}
      <GoogleSignInButton
        onError={(msg) => setError(msg)}
        className="w-full"
      />

      {/* ── Lien inscription ────────────────────────────── */}
      <p className="text-center text-sm text-muted-foreground">
        Pas encore de compte ?{" "}
        <Link href="/register" className="font-semibold text-primary hover:underline">
          Créer un compte
        </Link>
      </p>
    </div>
  );
}

export { LoginPageClient };
