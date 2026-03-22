"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Loader2, ArrowRight, Phone, KeyRound,
  ExternalLink,
} from "lucide-react";
import { OtpInput } from "@/components/ui";
import { CountryCodeSelector } from "./CountryCodeSelector";
import { GoogleSignInButton } from "./GoogleSignInButton";
import {
  checkPhone,
  loginUser,
  sendPhoneOtp,
  verifyOtp,
  OTP_TYPE,
  getAuthErrorMessage,
  setAuthTokenCookie,
  setTokenExpiry,
} from "../services/auth-service";
import type { AuthUserProfile } from "../services/auth-service";
import { mockCountryCodes } from "../mocks/auth";
import type { SocialProviderConfig } from "../mocks/auth";
import type { CountryCode } from "../models/auth";

// Étapes du flow phone
type PhoneLoginStep =
  | "phone"       // Étape 1 — saisie numéro
  | "pin"         // Étape 2a — saisie PIN
  | "otp-verify"  // Étape 2b — saisie OTP SMS
  | "not-found";  // Numéro non reconnu → proposer inscription

interface LoginPageClientProps {
  socialProviders: SocialProviderConfig[];
}


/** Saisie PIN — 4 cases numériques */
function PinInput({
  value, onChange, disabled,
}: {
  value: string; onChange: (v: string) => void; disabled?: boolean;
}) {
  const refs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  const handleChange = (idx: number, char: string) => {
    const digit = char.replace(/\D/g, "").slice(-1);
    const arr   = value.split("").slice(0, 4);
    arr[idx]    = digit;
    onChange(arr.join("").slice(0, 4));
    if (digit && idx < 3) refs[idx + 1]?.current?.focus();
  };

  const handleKey = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !value[idx] && idx > 0) refs[idx - 1]?.current?.focus();
  };

  return (
    <div className="flex gap-3">
      {[0, 1, 2, 3].map((idx) => (
        <input
          key={idx}
          ref={refs[idx]}
          type="password"
          inputMode="numeric"
          pattern="\d*"
          maxLength={1}
          value={value[idx] ?? ""}
          onChange={(e) => handleChange(idx, e.target.value)}
          onKeyDown={(e) => handleKey(idx, e)}
          disabled={disabled}
          className="h-14 w-14 rounded-xl border border-border bg-background text-center text-xl font-bold text-foreground transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
          aria-label={`Chiffre ${idx + 1} du PIN`}
        />
      ))}
    </div>
  );
}

function LoginPageClient({ socialProviders: _ }: LoginPageClientProps) {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const redirectTo   = searchParams.get("redirect") ?? "/";
  const safeRedirect = redirectTo.startsWith("/") ? redirectTo : "/";

  // ─── State ────────────────────────────────────────────────
  const [step,            setStep]            = useState<PhoneLoginStep>("phone");
  const [phone,           setPhone]           = useState("");
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(
    mockCountryCodes.find((c) => c.code === "BF") ?? mockCountryCodes[0]
  );
  const [pin,           setPin]           = useState("");
  const [otpIdentifier, setOtpIdentifier] = useState("");
  const [otpExpiresIn,  setOtpExpiresIn]  = useState(0);
  const [resendCooldown, setResendCooldown] = useState(0);

  const [loading,  setLoading]  = useState(false);
  const [error,     setError]     = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // ─── Helpers ──────────────────────────────────────────────
  const formatPhoneE164 = (raw: string): string => {
    const cleaned = raw.replace(/[\s\-(). ]/g, "");
    return cleaned.startsWith("+") ? cleaned : `${selectedCountry.dialCode}${cleaned}`;
  };

  const startResendCooldown = () => {
    setResendCooldown(60);
    const t = setInterval(() => {
      setResendCooldown((p) => { if (p <= 1) { clearInterval(t); return 0; } return p - 1; });
    }, 1000);
  };

  const handleSuccess = async (token: string, user: AuthUserProfile) => {
    const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
    await setAuthTokenCookie(token, expiresAt); // SEC-06 : HttpOnly via Route Handler
    setTokenExpiry(expiresAt);
    // Vendeur ou agence → espace dédié (pro.sugu.pro)
    const roles = user.roles ?? [];
    if (roles.includes("seller") || roles.includes("partner")) {
      window.location.href = "https://pro.sugu.pro";
      return;
    }
    router.push(safeRedirect);
    router.refresh();
  };

  // ─── ÉTAPE 1 : Vérification numéro ───────────────────────
  const handlePhoneSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const phoneE164 = formatPhoneE164(phone);
    if (!phone.trim()) { setError("Entrez votre numéro de téléphone"); return; }

    setLoading(true);
    try {
      const result = await checkPhone(phoneE164);

      if (!result.exists) {
        setStep("not-found");
        return;
      }

      if (result.redirect_to_pro) {
        // Vendeur/agence → ne pas les laisser sur la marketplace
        setError("");
        window.location.href = `https://pro.sugu.pro?phone=${encodeURIComponent(phoneE164)}`;
        return;
      }

      if (result.auth_method === "pin") {
        setStep("pin");
      } else {
        // auth_method = "otp" → compte Google → envoyer SMS directement
        const otpRes = await sendPhoneOtp(phoneE164);
        setOtpIdentifier(phoneE164);
        setOtpExpiresIn(otpRes.expires_in ?? 300);
        setStep("otp-verify");
        startResendCooldown();
      }
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phone, selectedCountry]);

  // ─── ÉTAPE 2a : Login avec PIN ───────────────────────────
  const handlePinLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (pin.length !== 4) { setError("Entrez votre code PIN (4 chiffres)"); return; }

    setLoading(true);
    try {
      const result = await loginUser({ login_field: formatPhoneE164(phone), password: pin });
      if (result.type === "success") handleSuccess(result.token, result.user);
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phone, pin, selectedCountry, safeRedirect]);

  // ─── ÉTAPE 2a → Oublié : Envoyer SMS ────────────────────
  const handleForgotPin = useCallback(async () => {
    setError("");
    const phoneE164 = formatPhoneE164(phone);
    setLoading(true);
    try {
      const res = await sendPhoneOtp(phoneE164);
      setOtpIdentifier(phoneE164);
      setOtpExpiresIn(res.expires_in ?? 300);
      setStep("otp-verify");
      startResendCooldown();
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phone, selectedCountry]);

  // ─── ÉTAPE 2b : Vérification OTP SMS ────────────────────
  const handleVerifyOtp = useCallback(async (code: string) => {
    setError("");
    setLoading(true);
    try {
      const result = await verifyOtp({
        identifier: otpIdentifier,
        code,
        type: OTP_TYPE.LOGIN_VERIFICATION,
      });
      if (result.token && result.user) {
        // Utiliser expires_at du backend si disponible, sinon 90j par défaut
        const expiresAt = result.expires_at
          ?? new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
        await setAuthTokenCookie(result.token, expiresAt);
        setTokenExpiry(expiresAt);
        handleSuccess(result.token, result.user);
      }
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otpIdentifier, safeRedirect]);

  const handleResend = useCallback(async () => {
    if (resendCooldown > 0) return;
    setError("");
    try {
      const res = await sendPhoneOtp(otpIdentifier);
      setOtpExpiresIn(res.expires_in ?? 300);
      setSuccessMsg("Code renvoyé !");
      setTimeout(() => setSuccessMsg(""), 3000);
      startResendCooldown();
    } catch (err) {
      setError(getAuthErrorMessage(err));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otpIdentifier, resendCooldown]);

  // ─── Champ téléphone (réutilisé) ─────────────────────────
  const PhoneField = (
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
          className="h-12 flex-1 border-none bg-transparent pl-3 pr-4 text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════
  // RENDU PAR ÉTAPE
  // ══════════════════════════════════════════════════════════

  // ── Étape "not-found" — numéro inconnu ───────────────────
  if (step === "not-found") {
    return (
      <div className="page-enter space-y-6">
        <button type="button" onClick={() => { setStep("phone"); setError(""); }}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Retour
        </button>

        <div className="rounded-2xl border border-border bg-muted/30 p-6 text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Phone className="h-8 w-8 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-foreground">Nouveau sur Sugu ?</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Ce numéro n&apos;a pas encore de compte.
              <br />Créez-en un en quelques secondes !
            </p>
          </div>
          <Link
            href={`/register?phone=${encodeURIComponent(formatPhoneE164(phone))}`}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-dark active:scale-[0.97]"
          >
            Créer mon compte <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
          <div className="relative flex justify-center text-xs"><span className="bg-background px-4 text-muted-foreground">Ou</span></div>
        </div>
        <GoogleSignInButton onError={(msg) => setError(msg)} className="w-full" />
        {error && <p className="text-xs text-error text-center" role="alert">{error}</p>}
      </div>
    );
  }

  // ── Étape "pin" — saisie du PIN ───────────────────────────
  if (step === "pin") {
    return (
      <div className="page-enter space-y-6">
        <button type="button" onClick={() => { setStep("phone"); setPin(""); setError(""); }}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Retour
        </button>

        <div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Code PIN</h1>
          <div className="mt-3 rounded-xl border border-border bg-muted/50 px-4 py-3">
            <p className="text-sm text-muted-foreground">Connexion pour</p>
            <p className="mt-0.5 font-semibold text-foreground">{formatPhoneE164(phone)}</p>
          </div>
        </div>

        <form onSubmit={handlePinLogin} className="space-y-5" noValidate>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <KeyRound className="h-4 w-4" /> Votre code PIN
            </label>
            <PinInput value={pin} onChange={(v) => { setPin(v); if (error) setError(""); }} disabled={loading} />
          </div>

          {error && <p className="text-xs text-error" role="alert">{error}</p>}

          <button type="submit" disabled={loading || pin.length !== 4}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-dark active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /><span>Vérification...</span></> : <><span>Se connecter</span><ArrowRight className="h-4 w-4" /></>}
          </button>

          <p className="text-center text-xs text-muted-foreground">
            PIN oublié ?{" "}
            <button type="button" onClick={handleForgotPin} disabled={loading}
              className="font-semibold text-primary hover:underline disabled:opacity-50"
            >
              Recevoir un code SMS
            </button>
          </p>
        </form>
      </div>
    );
  }

  // ── Étape "otp-verify" — code SMS ────────────────────────
  if (step === "otp-verify") {
    return (
      <div className="page-enter space-y-6">
        <button type="button" onClick={() => { setStep("phone"); setError(""); setSuccessMsg(""); }}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Retour
        </button>

        <div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Code SMS</h1>
          <div className="mt-3 rounded-xl border border-border bg-muted/50 px-4 py-3">
            <p className="text-sm text-muted-foreground">Code envoyé au</p>
            <p className="mt-0.5 font-semibold text-foreground">{otpIdentifier}</p>
            {otpExpiresIn > 0 && (
              <p className="mt-1 text-xs text-muted-foreground">Expire dans {Math.floor(otpExpiresIn / 60)} min</p>
            )}
          </div>
        </div>

        <div className="flex justify-start">
          <OtpInput length={6} onChange={() => setError("")} onComplete={handleVerifyOtp} error={!!error} disabled={loading} />
        </div>

        {error      && <p className="text-xs text-error"   role="alert">{error}</p>}
        {successMsg && <p className="text-xs text-green-600" role="status">{successMsg}</p>}
        {loading    && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /><span>Vérification...</span></div>}

        <p className="text-sm text-muted-foreground">
          Pas reçu ?{" "}
          <button type="button" onClick={handleResend} disabled={resendCooldown > 0}
            className="font-semibold text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {resendCooldown > 0 ? `Renvoyer (${resendCooldown}s)` : "Renvoyer le code"}
          </button>
        </p>
      </div>
    );
  }

  // ── Étape "phone" — saisie initiale du numéro ────────────
  return (
    <div className="page-enter space-y-6">

      <div>
        <h1 className="text-3xl font-bold text-foreground sm:text-4xl">Connexion</h1>
        <p className="mt-2 text-sm text-muted-foreground">Bon retour sur Sugu 👋</p>
      </div>

      <form onSubmit={handlePhoneSubmit} className="space-y-4" noValidate>
        {PhoneField}

        {error && <p className="text-xs text-error" role="alert">{error}</p>}

        <button type="submit" id="login-phone-submit" disabled={loading}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-dark active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <><Loader2 className="h-4 w-4 animate-spin" /><span>Vérification...</span></>
          ) : (
            <><span>Continuer</span><ArrowRight className="h-4 w-4" /></>
          )}
        </button>
      </form>

      {/* ── Séparateur ──────────────────────────────────── */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
        <div className="relative flex justify-center text-xs"><span className="bg-background px-4 text-muted-foreground">Ou</span></div>
      </div>

      {/* ── Google ──────────────────────────────────────── */}
      <GoogleSignInButton onError={(msg) => setError(msg)} className="w-full" />

      {/* ── Inscription ──────────────────── */}
      <p className="text-center text-sm text-muted-foreground">
        Pas encore de compte ?{" "}
        <Link href="/register" className="font-semibold text-primary hover:underline">
          Créer un compte
        </Link>
      </p>

      {/* ── Lien pro pour vendeurs ──────────────────────── */}
      <p className="text-center text-xs text-muted-foreground">
        Vous êtes vendeur ?{" "}
        <a href="https://pro.sugu.pro" className="inline-flex items-center gap-1 font-semibold text-primary hover:underline">
          Accéder au dashboard <ExternalLink className="h-3 w-3" />
        </a>
      </p>
    </div>
  );
}

export { LoginPageClient };
