"use client";

import { useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight, Loader2, User,
} from "lucide-react";
import { OtpInput } from "@/components/ui";
import { CountryCodeSelector } from "./CountryCodeSelector";
import { GoogleSignInButton } from "./GoogleSignInButton";
import {
  registerUser,
  sendPhoneOtp,
  verifyPhone,
  getAuthErrorMessage,
  safeRelativePath,
} from "../services/auth-service";
import { mockCountryCodes } from "../mocks/auth";
import type { CountryCode } from "../models/auth";

// Le PIN est SUPPRIMÉ — l'inscription est OTP-only :
//   form → nom + téléphone → SMS OTP envoyé
//   otp  → code SMS vérifié → token one-use → POST /register → tokens → auto-login
type RegisterStep = "form" | "otp";

function RegisterPageClient() {
  const searchParams = useSearchParams();
  // Open-redirect defence (safeRelativePath bloque `//evil.com`, `/\evil`, …)
  const safeRedirect = safeRelativePath(searchParams.get("redirect"));

  // Pré-remplir le numéro si redirigé depuis login (numéro non trouvé)
  const phoneFromQuery = searchParams.get("phone") ?? "";

  // ─── Steps & fields ───────────────────────────────────────
  const [step, setStep] = useState<RegisterStep>("form");
  const [name, setName] = useState("");

  // Détecter le pays depuis le préfixe du numéro pré-rempli
  const defaultCountry = mockCountryCodes.find((c) =>
    phoneFromQuery ? phoneFromQuery.startsWith(c.dialCode) : c.code === "BF"
  ) ?? mockCountryCodes.find((c) => c.code === "BF") ?? mockCountryCodes[0];

  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(defaultCountry);

  // Afficher le numéro sans l'indicatif si pré-rempli
  const rawFromQuery = phoneFromQuery && phoneFromQuery.startsWith(defaultCountry.dialCode)
    ? phoneFromQuery.slice(defaultCountry.dialCode.length)
    : phoneFromQuery;
  const [phone, setPhone] = useState(rawFromQuery);

  const [resendCooldown, setResendCooldown] = useState(0);
  const [loading,        setLoading]        = useState(false);
  const [error,          setError]          = useState("");
  const [fieldErrors,    setFieldErrors]    = useState<Record<string, string>>({});
  const [otpAttemptKey,  setOtpAttemptKey]  = useState(0);

  // ─── Helpers ──────────────────────────────────────────────
  const formatPhoneE164 = (raw: string): string => {
    const cleaned = raw.replace(/[\s\-(). ]/g, "");
    return cleaned.startsWith("+") ? cleaned : `${selectedCountry.dialCode}${cleaned}`;
  };

  const onSuccess = (_expiresAt?: string) => {
    // expires_at est déjà persisté par auth-service via consumeAuthEnvelope
    // — qui n'est appelé que si le BFF a confirmé la pose du cookie HttpOnly.
    // Hard navigation → force rechargement complet (header remonte + checkAuth refired).
    window.location.href = safeRedirect;
  };

  const startResendCooldown = () => {
    setResendCooldown(60);
    const t = setInterval(() => {
      setResendCooldown((p) => { if (p <= 1) { clearInterval(t); return 0; } return p - 1; });
    }, 1000);
  };

  // ─── STEP 1 : Envoi OTP ───────────────────────────────────
  const handleFormSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    const errs: Record<string, string> = {};
    if (name.trim().length < 2) errs.name = "Entrez votre nom complet (min 2 car.)";
    const cleaned = phone.replace(/[\s\-(). ]/g, "");
    if (cleaned.length < 7) errs.phone = "Numéro invalide";
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }

    setLoading(true);
    try {
      await sendPhoneOtp(formatPhoneE164(phone));
      setStep("otp");
      startResendCooldown();
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, phone, selectedCountry]);

  // ─── STEP 2 : OTP vérifié → register atomique → auto-login
  // Le PIN n'existe plus : à la vérification OTP, on enchaîne
  // immédiatement avec /register en passant le `phone_verified_token`
  // one-use. Le backend marque phone_verified_at = now() et renvoie un
  // token de session — l'utilisateur est connecté.
  const handleOtpComplete = useCallback(async (code: string) => {
    setError("");
    setLoading(true);
    try {
      const verifyResult = await verifyPhone({
        phone_e164: formatPhoneE164(phone),
        code,
      });

      if (!verifyResult.verified_token) {
        // Anomalie serveur : token absent → on demande de réessayer.
        throw new Error("Réponse de vérification incomplète. Veuillez réessayer.");
      }

      const registerResult = await registerUser({
        name:                 name.trim(),
        phone_e164:           formatPhoneE164(phone),
        user_type:            "buyer",
        phone_verified_token: verifyResult.verified_token,
      });

      if (registerResult.user) onSuccess(registerResult.expires_at);
    } catch (err) {
      setError(getAuthErrorMessage(err));
      setOtpAttemptKey((key) => key + 1);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, phone, selectedCountry, safeRedirect]);

  // ══════════════════════════════════════════════════════════
  // ─── RENDU ────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════

  return (
    <div className="page-enter space-y-6">

      <div>
        <h1 className="text-3xl font-bold text-foreground sm:text-4xl">Créer un compte</h1>
        <p className="mt-2 text-sm text-muted-foreground">L&apos;aventure Sugu commence ici</p>
      </div>


      {/* ════════════════════════════════════════════════════ */}
      {/* STEP 1 : Formulaire ────────────────────────────── */}
      {/* ════════════════════════════════════════════════════ */}
      {step === "form" && (
        <form onSubmit={handleFormSubmit} className="space-y-4" noValidate>

          {/* Nom */}
          <div className="space-y-1.5">
            <label htmlFor="reg-name" className="text-sm font-medium text-foreground">Nom complet</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                id="reg-name"
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); if (fieldErrors.name) setFieldErrors(p => ({ ...p, name: "" })); }}
                placeholder="Prénom Nom"
                autoComplete="name"
                className={`h-12 w-full rounded-xl border bg-background pl-11 pr-4 text-sm transition-all focus:outline-none focus:ring-2 ${
                  fieldErrors.name ? "border-error focus:ring-error/20" : "border-border focus:border-primary focus:ring-primary/20"
                }`}
              />
            </div>
            {fieldErrors.name && <p className="text-xs text-error">{fieldErrors.name}</p>}
          </div>

          {/* Téléphone */}
          <div className="space-y-1.5">
            <label htmlFor="reg-phone" className="text-sm font-medium text-foreground">Numéro de téléphone</label>
            <div className={`flex items-center rounded-xl border bg-background transition-all focus-within:ring-2 ${
              fieldErrors.phone ? "border-error focus-within:ring-error/20" : "border-border focus-within:border-primary focus-within:ring-primary/20"
            }`}>
              <div className="flex items-center border-r border-border pl-2 pr-1">
                <CountryCodeSelector countryCodes={mockCountryCodes} value={selectedCountry} onChange={setSelectedCountry} />
                <span className="text-xs text-muted-foreground pr-2 select-none">{selectedCountry.dialCode}</span>
              </div>
              <input
                id="reg-phone"
                type="tel"
                value={phone}
                onChange={(e) => { setPhone(e.target.value); if (fieldErrors.phone) setFieldErrors(p => ({ ...p, phone: "" })); }}
                placeholder="70 00 00 00"
                autoComplete="tel-national"
                className="h-12 flex-1 border-none bg-transparent pl-3 pr-4 text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
            {fieldErrors.phone && <p className="text-xs text-error">{fieldErrors.phone}</p>}
          </div>

          {error && <p className="text-xs text-error" role="alert">{error}</p>}

          <button type="submit" id="reg-submit-form" disabled={loading}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-dark active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /><span>Envoi SMS...</span></> : <><span>Recevoir le code SMS</span><ArrowRight className="h-4 w-4" /></>}
          </button>

          {/* ── Google ──────────────────────────────────── */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-xs"><span className="bg-background px-4 text-muted-foreground">Ou</span></div>
          </div>
          <GoogleSignInButton onError={(msg) => setError(msg)} className="w-full" />

          <p className="text-center text-sm text-muted-foreground">
            Déjà un compte ?{" "}
            <Link href="/login" className="font-semibold text-primary hover:underline">Se connecter</Link>
          </p>
        </form>
      )}

      {/* ════════════════════════════════════════════════════ */}
      {/* STEP 2 : OTP SMS → register + auto-login ────────── */}
      {/* ════════════════════════════════════════════════════ */}
      {step === "otp" && (
        <div className="space-y-5">
          <button type="button" onClick={() => { setStep("form"); setError(""); }}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Retour
          </button>

          <div className="rounded-xl border border-border bg-muted/50 px-4 py-3">
            <p className="text-sm text-muted-foreground">Code envoyé au</p>
            <p className="mt-0.5 font-semibold text-foreground">{formatPhoneE164(phone)}</p>
          </div>

          <p className="text-sm font-medium text-foreground">Entrez le code à 6 chiffres reçu par SMS</p>

          <div className="flex justify-start">
            <OtpInput key={otpAttemptKey} length={6} onChange={() => setError("")} onComplete={handleOtpComplete} error={!!error} disabled={loading} />
          </div>

          {error   && <p className="text-xs text-error" role="alert">{error}</p>}
          {loading && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /><span>Création du compte...</span></div>}

          <p className="text-sm text-muted-foreground">
            Pas reçu ?{" "}
            <button type="button" disabled={resendCooldown > 0} onClick={async () => {
              if (resendCooldown > 0) return;
              try { await sendPhoneOtp(formatPhoneE164(phone)); startResendCooldown(); }
              catch (err) { setError(getAuthErrorMessage(err)); }
            }} className="font-semibold text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed">
              {resendCooldown > 0 ? `Renvoyer (${resendCooldown}s)` : "Renvoyer"}
            </button>
          </p>
        </div>
      )}
    </div>
  );
}

export { RegisterPageClient };
