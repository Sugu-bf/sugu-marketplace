"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight, Loader2, User, KeyRound,
} from "lucide-react";
import { OtpInput } from "@/components/ui";
import { CountryCodeSelector } from "./CountryCodeSelector";
import { GoogleSignInButton } from "./GoogleSignInButton";
import {
  registerUser,
  sendPhoneOtp,
  verifyPhone,
  getAuthErrorMessage,
  setAuthTokenCookie,
  setTokenExpiry,
} from "../services/auth-service";
import { mockCountryCodes } from "../mocks/auth";
import type { CountryCode } from "../models/auth";

// 3 étapes : infos → OTP → PIN
type RegisterStep = "form" | "otp" | "pin";


/** Saisie PIN — 4 cases numériques */
function PinInput({
  value, onChange, disabled, id,
}: {
  value: string; onChange: (v: string) => void; disabled?: boolean; id?: string;
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
    <div className="flex gap-3" id={id}>
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

function RegisterPageClient() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const redirectTo   = searchParams.get("redirect") ?? "/";
  const safeRedirect = redirectTo.startsWith("/") ? redirectTo : "/";

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

  const [pin,        setPin]        = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  // SEC-01 : token OTP one-use retourné par /verify-phone
  // Prouve la possession du numéro avant la création du compte
  const [verifiedToken, setVerifiedToken] = useState<string | undefined>(undefined);

  const [resendCooldown, setResendCooldown] = useState(0);
  const [loading,        setLoading]        = useState(false);
  const [error,          setError]          = useState("");
  const [fieldErrors,    setFieldErrors]    = useState<Record<string, string>>({});

  // ─── Helpers ──────────────────────────────────────────────
  const formatPhoneE164 = (raw: string): string => {
    const cleaned = raw.replace(/[\s\-(). ]/g, "");
    return cleaned.startsWith("+") ? cleaned : `${selectedCountry.dialCode}${cleaned}`;
  };

  const onSuccess = async (token: string) => {
    const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
    await setAuthTokenCookie(token, expiresAt); // SEC-06 : HttpOnly via Route Handler
    setTokenExpiry(expiresAt);
    router.push(safeRedirect);
    router.refresh();
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

  // ─── STEP 2 : Vérification OTP ────────────────────────────
  const handleOtpComplete = useCallback(async (code: string) => {
    setError("");
    setLoading(true);
    try {
      const result = await verifyPhone({ phone_e164: formatPhoneE164(phone), code });
      // SEC-01 : stocker le verified_token one-use (sera requis au register)
      setVerifiedToken(result.verified_token);
      setStep("pin");
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phone, selectedCountry]);

  // ─── STEP 3 : Création compte avec PIN ───────────────────
  const handlePinSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (pin.length !== 4) { setError("Entrez un code PIN de 4 chiffres"); return; }
    if (pin !== pinConfirm) { setError("Les codes PIN ne correspondent pas"); return; }

    setLoading(true);
    try {
      // Sur la marketplace, user_type est TOUJOURS "buyer"
      // Les vendeurs ont leur propre espace : pro.sugu.pro
      const result = await registerUser({
        name:                 name.trim(),
        phone_e164:           formatPhoneE164(phone),
        pin,
        user_type:            "buyer",
        phone_verified_token: verifiedToken, // SEC-01 : preuve de possession du numéro
      });
      if (result.token) onSuccess(result.token);
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin, pinConfirm, name, phone, selectedCountry, safeRedirect, verifiedToken]);

  // ══════════════════════════════════════════════════════════
  // ─── RENDU ────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════

  return (
    <div className="page-enter space-y-6">

      <div>
        <h1 className="text-3xl font-bold text-foreground sm:text-4xl">Créer un compte</h1>
        <p className="mt-2 text-sm text-muted-foreground">Rejoignez Sugu et commencez à acheter 🚀</p>
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
      {/* STEP 2 : OTP SMS ─────────────────────────────────── */}
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
            <OtpInput length={6} onChange={() => setError("")} onComplete={handleOtpComplete} error={!!error} disabled={loading} />
          </div>

          {error   && <p className="text-xs text-error" role="alert">{error}</p>}
          {loading && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /><span>Vérification...</span></div>}

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

      {/* ════════════════════════════════════════════════════ */}
      {/* STEP 3 : SET PIN ─────────────────────────────────── */}
      {/* ════════════════════════════════════════════════════ */}
      {step === "pin" && (
        <form onSubmit={handlePinSubmit} className="space-y-5">
          <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-green-600 font-bold">✓</span>
              <p className="text-sm font-medium text-green-800">Numéro vérifié</p>
            </div>
            <p className="mt-0.5 text-xs text-green-700">{formatPhoneE164(phone)}</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <KeyRound className="h-4 w-4" /> Choisissez votre code PIN
            </label>
            <p className="text-xs text-muted-foreground">
              4 chiffres — utilisé pour vous connecter sur Sugu (web &amp; mobile)
            </p>
            <PinInput id="reg-pin" value={pin} onChange={(v) => { setPin(v); if (error) setError(""); }} disabled={loading} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Confirmez votre PIN</label>
            <PinInput id="reg-pin-confirm" value={pinConfirm} onChange={(v) => { setPinConfirm(v); if (error) setError(""); }} disabled={loading} />
          </div>

          {error && <p className="text-xs text-error" role="alert">{error}</p>}

          <button type="submit" id="reg-submit-pin" disabled={loading || pin.length !== 4 || pinConfirm.length !== 4}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-dark active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /><span>Création...</span></> : <><span>Créer mon compte</span><ArrowRight className="h-4 w-4" /></>}
          </button>
        </form>
      )}
    </div>
  );
}

export { RegisterPageClient };
