"use client";

import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  Check,
  Mail,
  Phone,
  User,
  Lock,
} from "lucide-react";
import { OtpInput } from "@/components/ui";
import { CountryCodeSelector } from "./CountryCodeSelector";
import { GoogleSignInButton } from "./GoogleSignInButton";
import {
  registerUser,
  verifyOtp,
  resendOtp,
  OTP_TYPE,
  getAuthErrorMessage,
} from "../services/auth-service";
import { mockCountryCodes } from "../mocks/auth";
import type { CountryCode } from "../models/auth";

type RegisterMethod = "phone" | "email";
type RegisterStep = "form" | "verify-email";

/** Stocker le token dans un cookie sécurisé */
function setAuthCookie(token: string): void {
  if (typeof document === "undefined") return;
  const isHttps = window.location.protocol === "https:";
  const secure = isHttps ? "; Secure" : "";
  document.cookie = `auth_token=${encodeURIComponent(token)}; path=/; max-age=${
    60 * 60 * 24 * 7
  }; SameSite=Lax${secure}`;
}

function RegisterPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "/";
  const safeRedirect = redirectTo.startsWith("/") ? redirectTo : "/";

  // ─── Method switch ─────────────────────────────────────────
  const [method, setMethod] = useState<RegisterMethod>("phone");

  // ─── Steps ────────────────────────────────────────────────
  const [step, setStep] = useState<RegisterStep>("form");
  const [registeredEmail, setRegisteredEmail] = useState("");

  // ─── Fields ───────────────────────────────────────────────
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(
    mockCountryCodes.find((c) => c.code === "BF") ?? mockCountryCodes[0]
  );
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // ─── UI ───────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState("");
  const [otpError, setOtpError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  // ─── Validation ───────────────────────────────────────────
  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (name.trim().length < 2) e.name = "Entrez votre nom complet";
    if (method === "email") {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
        e.email = "Email invalide";
      if (password.length < 8) e.password = "8 caractères minimum";
    } else {
      const cleaned = phone.replace(/[\s\-(). ]/g, "");
      if (cleaned.length < 7) e.phone = "Numéro invalide";
      if (password.length < 8) e.password = "8 caractères minimum";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const formatPhoneE164 = (raw: string): string => {
    const cleaned = raw.replace(/[\s\-(). ]/g, "");
    return cleaned.startsWith("+") ? cleaned : `${selectedCountry.dialCode}${cleaned}`;
  };

  // ─── Submit ───────────────────────────────────────────────
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setGlobalError("");
      if (!validate()) return;

      // Pour la méthode téléphone le backend web requiert aussi un email —
      // on génère un email fictif à partir du numéro (phone_e164@sugu.app).
      // L'utilisateur pourra renseigner son vrai email dans les paramètres.
      const phoneE164 = method === "phone" ? formatPhoneE164(phone) : "";
      const emailField =
        method === "email"
          ? email.trim()
          : `${phoneE164.replace("+", "")}@sugu.app`;

      setLoading(true);
      try {
        const result = await registerUser({
          name: name.trim(),
          email: emailField,
          phone_e164: method === "phone" ? phoneE164 : `+226${Date.now().toString().slice(-8)}`,
          password,
          password_confirmation: password, // même valeur — l'OTP est la vraie vérification
          user_type: "buyer", // défaut, modifiable dans les paramètres
        });

        if (result.token) setAuthCookie(result.token);

        if (method === "email" && result.verification_required?.email) {
          setRegisteredEmail(emailField);
          setStep("verify-email");
        } else {
          // Pour phone : pas de vérification email (email fictif), on redirige
          router.push(safeRedirect);
          router.refresh();
        }
      } catch (err) {
        setGlobalError(getAuthErrorMessage(err));
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [method, name, email, phone, password, selectedCountry, safeRedirect]
  );

  // ─── OTP Verify ───────────────────────────────────────────
  const handleVerifyEmail = useCallback(
    async (code: string) => {
      setOtpError("");
      setLoading(true);
      try {
        await verifyOtp({
          identifier: registeredEmail,
          code,
          type: OTP_TYPE.EMAIL_VERIFICATION,
        });
        setSuccessMsg("Email vérifié ! Redirection...");
        setTimeout(() => {
          router.push(safeRedirect);
          router.refresh();
        }, 1200);
      } catch (err) {
        setOtpError(getAuthErrorMessage(err));
      } finally {
        setLoading(false);
      }
    },
    [registeredEmail, router, safeRedirect]
  );

  const handleResend = useCallback(async () => {
    if (resendCooldown > 0) return;
    try {
      await resendOtp({ identifier: registeredEmail, type: OTP_TYPE.EMAIL_VERIFICATION });
      setSuccessMsg("Code renvoyé !");
      setTimeout(() => setSuccessMsg(""), 3000);
      setResendCooldown(60);
      const t = setInterval(() => {
        setResendCooldown((p) => { if (p <= 1) { clearInterval(t); return 0; } return p - 1; });
      }, 1000);
    } catch (err) {
      setOtpError(getAuthErrorMessage(err));
    }
  }, [registeredEmail, resendCooldown]);

  // ─── Step: Verify email OTP ───────────────────────────────
  if (step === "verify-email") {
    return (
      <div className="page-enter space-y-6">
        <div>
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <Mail className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            Vérifiez votre email
          </h1>
          <div className="mt-3 rounded-xl border border-border bg-muted/50 px-4 py-3">
            <p className="text-sm text-muted-foreground">Code envoyé à</p>
            <p className="mt-0.5 text-sm font-semibold text-foreground">{registeredEmail}</p>
          </div>
        </div>

        <div className="flex justify-start">
          <OtpInput length={6} onChange={() => setOtpError("")} onComplete={handleVerifyEmail} error={!!otpError} disabled={loading} />
        </div>

        {otpError && <p className="text-xs text-error" role="alert">{otpError}</p>}
        {successMsg && (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <Check className="h-4 w-4" />
            <span>{successMsg}</span>
          </div>
        )}
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

  // ─── Step: Form ───────────────────────────────────────────
  return (
    <div className="page-enter space-y-6">

      <div>
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Créer un compte</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Rejoignez Sugu en quelques secondes.
        </p>
      </div>

      {/* ── Method tabs ─────────────────────────────────── */}
      <div className="flex gap-2 rounded-xl border border-border bg-muted/30 p-1">
        <button
          type="button"
          onClick={() => { setMethod("phone"); setErrors({}); setGlobalError(""); }}
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
          onClick={() => { setMethod("email"); setErrors({}); setGlobalError(""); }}
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
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>

        {/* Nom complet */}
        <div className="space-y-1.5">
          <label htmlFor="reg-name" className="text-sm font-medium text-foreground">
            Nom complet
          </label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="reg-name"
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); if (errors.name) setErrors((p) => ({ ...p, name: "" })); }}
              placeholder="Amadou Ouédraogo"
              autoComplete="name"
              className={`h-12 w-full rounded-xl border bg-background pl-11 pr-4 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary ${errors.name ? "border-error" : "border-border"}`}
            />
          </div>
          {errors.name && <p className="text-xs text-error">{errors.name}</p>}
        </div>

        {/* Téléphone ou Email selon le tab */}
        {method === "phone" ? (
          <div className="space-y-1.5">
            <label htmlFor="reg-phone" className="text-sm font-medium text-foreground">
              Numéro de téléphone
            </label>
            <div className={`flex items-center rounded-xl border bg-background transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 ${errors.phone ? "border-error" : "border-border"}`}>
              <div className="flex items-center border-r border-border pl-2 pr-1">
                <CountryCodeSelector countryCodes={mockCountryCodes} value={selectedCountry} onChange={setSelectedCountry} />
                <span className="text-xs text-muted-foreground pr-2 select-none">{selectedCountry.dialCode}</span>
              </div>
              <input
                id="reg-phone"
                type="tel"
                value={phone}
                onChange={(e) => { setPhone(e.target.value); if (errors.phone) setErrors((p) => ({ ...p, phone: "" })); }}
                placeholder="70 00 00 00"
                autoComplete="tel-national"
                className="h-12 flex-1 border-none bg-transparent pl-3 pr-4 text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
            </div>
            {errors.phone && <p className="text-xs text-error">{errors.phone}</p>}
          </div>
        ) : (
          <div className="space-y-1.5">
            <label htmlFor="reg-email" className="text-sm font-medium text-foreground">
              Adresse email
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                id="reg-email"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors((p) => ({ ...p, email: "" })); }}
                placeholder="votre@email.com"
                autoComplete="email"
                className={`h-12 w-full rounded-xl border bg-background pl-11 pr-4 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary ${errors.email ? "border-error" : "border-border"}`}
              />
            </div>
            {errors.email && <p className="text-xs text-error">{errors.email}</p>}
          </div>
        )}

        {/* Mot de passe — un seul champ */}
        <div className="space-y-1.5">
          <label htmlFor="reg-password" className="text-sm font-medium text-foreground">
            Mot de passe
          </label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="reg-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors((p) => ({ ...p, password: "" })); }}
              placeholder="8 caractères minimum"
              autoComplete="new-password"
              className={`h-12 w-full rounded-xl border bg-background pl-11 pr-12 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary ${errors.password ? "border-error" : "border-border"}`}
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
          {errors.password && <p className="text-xs text-error">{errors.password}</p>}
          {/* Barre de force */}
          {password && (
            <div className="flex gap-1">
              {[password.length >= 8, /[A-Z]/.test(password), /[a-z]/.test(password), /\d/.test(password), /[^A-Za-z0-9]/.test(password)].map((ok, i) => (
                <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${ok ? "bg-green-500" : "bg-border"}`} />
              ))}
            </div>
          )}
        </div>

        {globalError && <p className="text-xs text-error" role="alert">{globalError}</p>}

        <button
          type="submit"
          disabled={loading}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-primary-dark active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <><Loader2 className="h-4 w-4 animate-spin" /><span>Création...</span></>
          ) : (
            <><span>Créer mon compte</span><ArrowRight className="h-4 w-4" /></>
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
        onError={(msg) => setGlobalError(msg)}
        className="w-full"
      />

      <p className="text-center text-sm text-muted-foreground">
        Déjà un compte ?{" "}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Se connecter
        </Link>
      </p>
    </div>
  );
}

export { RegisterPageClient };
