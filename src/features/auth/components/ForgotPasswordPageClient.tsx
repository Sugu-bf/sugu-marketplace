"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Check,
  KeyRound,
} from "lucide-react";
import { OtpInput } from "@/components/ui";
import { CountryCodeSelector } from "./CountryCodeSelector";
import { mockCountryCodes } from "../mocks/auth";
import type { CountryCode } from "../models/auth";
import {
  forgotPassword,
  forgotPasswordByPhone,
  resetPassword,
  resendOtp,
  verifyOtp,
  verifyPhone,
  OTP_TYPE,
  getAuthErrorMessage,
} from "../services/auth-service";

type ForgotStep = "email" | "otp" | "new-password" | "success";
type ForgotMethod = "email" | "phone";

function ForgotPasswordPageClient() {
  const router = useRouter();

  // Method switch
  const [forgotMethod, setForgotMethod] = useState<ForgotMethod>("email");

  // Step management
  const [step, setStep] = useState<ForgotStep>("email");
  const [emailValue, setEmailValue] = useState("");
  const [phoneValue, setPhoneValue] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(
    mockCountryCodes.find((c) => c.code === "BF") ?? mockCountryCodes[0]
  );
  const [verifiedOtpCode, setVerifiedOtpCode] = useState("");

  // New password fields
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [successMessage, setSuccessMessage] = useState("");

  // Helper
  const formatPhoneE164 = (raw: string) => {
    const cleaned = raw.replace(/[\s\-(). ]/g, "");
    return cleaned.startsWith("+") ? cleaned : `${selectedCountry.dialCode}${cleaned}`;
  };

  const activeIdentifier = forgotMethod === "email" ? emailValue.trim() : formatPhoneE164(phoneValue);

  // ─── Step 1: Envoyer l'email de réinitialisation ───────────
  const handleSendEmail = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError("");

      if (forgotMethod === "email") {
        if (!emailValue.trim()) { setError("Entrez votre adresse email"); return; }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) { setError("Entrez une adresse email valide"); return; }
        setLoading(true);
        try {
          await forgotPassword(emailValue.trim());
          setStep("otp");
        } catch (err) {
          setError(getAuthErrorMessage(err));
        } finally {
          setLoading(false);
        }
      } else {
        // Méthode téléphone
        const phone = formatPhoneE164(phoneValue);
        if (!phoneValue.trim()) { setError("Entrez votre numéro de téléphone"); return; }
        setLoading(true);
        try {
          await forgotPasswordByPhone(phone);
          setStep("otp");
        } catch (err) {
          setError(getAuthErrorMessage(err));
        } finally {
          setLoading(false);
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [forgotMethod, emailValue, phoneValue, selectedCountry]
  );

  // ─── Étape 2 : Vérification OTP ─────────────────────────────
  //
  // SEC-01 FIX : le code est vérifié côté serveur QUELLE QUE SOIT la méthode.
  // - Email  → POST /web-auth/verify-otp (type=PASSWORD_RESET)
  // - Téléphone → POST /web-auth/verify-phone (vérifie l'OTP SMS Ikoddi)
  //
  // AVANT ce fix : pour la méthode téléphone, n'importe quel code
  // passait et l'utilisateur accédait à l'écran "new-password" sans OTP valide.
  const handleVerifyOtp = useCallback(
    async (code: string) => {
      setError("");
      setLoading(true);
      try {
        if (forgotMethod === "email") {
          // Vérification OTP email côté serveur
          await verifyOtp({
            identifier: emailValue.trim(),
            code,
            type: OTP_TYPE.PASSWORD_RESET,
          });
        } else {
          // SEC-01 : vérification OTP SMS côté serveur (Ikoddi) — était manquant
          await verifyPhone({
            phone_e164: formatPhoneE164(phoneValue),
            code,
          });
        }
        // Seulement si le serveur accepte le code
        setVerifiedOtpCode(code);
        setStep("new-password");
      } catch (err) {
        setError(getAuthErrorMessage(err));
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [forgotMethod, emailValue, phoneValue, selectedCountry]
  );

  // ─── Step 3: Réinitialiser le mot de passe ─────────────────
  const handleResetPassword = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError("");

      if (!newPassword) {
        setError("Entrez un nouveau mot de passe");
        return;
      }
      if (newPassword.length < 8) {
        setError("Le mot de passe doit contenir au moins 8 caractères");
        return;
      }
      if (newPassword !== confirmPassword) {
        setError("Les mots de passe ne correspondent pas");
        return;
      }

      setLoading(true);
      try {
        await resetPassword({
          email: emailValue.trim(),
          code: verifiedOtpCode,
          password: newPassword,
          password_confirmation: confirmPassword,
        });
        setStep("success");
      } catch (err) {
        const msg = getAuthErrorMessage(err);
        // Si le code a expiré entre l'étape 2 et 3 (rare), retour à l'OTP
        if (msg.toLowerCase().includes("invalide") || msg.toLowerCase().includes("expiré")) {
          setStep("otp");
          setVerifiedOtpCode("");
          setError("Le code a expiré. Veuillez en saisir un nouveau.");
        } else {
          setError(msg);
        }
      } finally {
        setLoading(false);
      }
    },
    [emailValue, verifiedOtpCode, newPassword, confirmPassword]
  );

  // ─── Renvoyer l'OTP ────────────────────────────────────────
  const handleResend = useCallback(async () => {
    if (resendCooldown > 0) return;
    setError("");
    try {
      if (forgotMethod === "email") {
        await resendOtp({
          identifier: emailValue.trim(),
          type: OTP_TYPE.PASSWORD_RESET,
        });
      } else {
        // SEC-10 FIX : renvoyer le SMS (avant : message "Code renvoyé !" mensonger)
        await forgotPasswordByPhone(formatPhoneE164(phoneValue));
      }
      setSuccessMessage("Code renvoyé !");
      setTimeout(() => setSuccessMessage(""), 3000);
      setResendCooldown(60);
      const timer = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) { clearInterval(timer); return 0; }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      setError(getAuthErrorMessage(err));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forgotMethod, emailValue, phoneValue, selectedCountry, resendCooldown]);

  // ─── Étape Succès ──────────────────────────────────────────
  if (step === "success") {
    return (
      <div className="page-enter space-y-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-green-100">
          <Check className="h-8 w-8 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">
          Mot de passe réinitialisé !
        </h1>
        <p className="text-sm text-muted-foreground">
          Votre mot de passe a été modifié avec succès. Vous pouvez maintenant
          vous connecter avec votre nouveau mot de passe.
        </p>
        <button
          type="button"
          onClick={() => router.push("/login")}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-dark active:scale-[0.97]"
        >
          <span>Se connecter</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    );
  }

  // ─── Étape : Nouveau mot de passe ──────────────────────────
  if (step === "new-password") {
    return (
      <div className="page-enter space-y-6">
        <button
          type="button"
          onClick={() => setStep("otp")}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground rounded-lg p-1"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <div>
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <Lock className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            Nouveau mot de passe
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Choisissez un nouveau mot de passe sécurisé.
          </p>
        </div>

        <form onSubmit={handleResetPassword} className="space-y-4" noValidate>
          {/* New Password */}
          <div className="space-y-1.5">
            <label htmlFor="new-password" className="text-sm font-medium text-foreground">
              Nouveau mot de passe
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                id="new-password"
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setError("");
                }}
                placeholder="••••••••"
                autoComplete="new-password"
                className="h-12 w-full rounded-xl border border-border bg-background pl-11 pr-12 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
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
            {newPassword && (
              <div className="flex gap-1 mt-1">
                {[
                  newPassword.length >= 8,
                  /[A-Z]/.test(newPassword),
                  /[a-z]/.test(newPassword),
                  /\d/.test(newPassword),
                  /[^A-Za-z0-9]/.test(newPassword),
                ].map((ok, i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      ok ? "bg-green-500" : "bg-border"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label htmlFor="confirm-new-password" className="text-sm font-medium text-foreground">
              Confirmer le mot de passe
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                id="confirm-new-password"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setError("");
                }}
                placeholder="••••••••"
                autoComplete="new-password"
                className="h-12 w-full rounded-xl border border-border bg-background pl-11 pr-12 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showConfirmPassword ? "Masquer" : "Afficher"}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-xs text-error" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-dark active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Réinitialisation...</span>
              </>
            ) : (
              <>
                <span>Réinitialiser le mot de passe</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>
      </div>
    );
  }

  // ─── Étape OTP ─────────────────────────────────────────────
  if (step === "otp") {
    return (
      <div className="page-enter space-y-6">
        <button
          type="button"
          onClick={() => setStep("email")}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground rounded-lg p-1"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <div>
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <KeyRound className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            Vérification
          </h1>
          <div className="mt-3 rounded-xl border border-border bg-muted/50 px-4 py-3">
            <p className="text-sm text-muted-foreground">
              Un code de vérification à 6 chiffres a été envoyé à
            </p>
            <p className="mt-0.5 text-sm font-semibold text-foreground">
              {activeIdentifier}
            </p>
          </div>
        </div>

        <div className="mt-8 flex justify-start">
          <OtpInput
            length={6}
            onChange={() => setError("")}
            onComplete={handleVerifyOtp}
            error={!!error}
            disabled={loading}
          />
        </div>

        {/* Loading pendant vérification OTP */}
        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Vérification du code...</span>
          </div>
        )}

        {error && (
          <p className="text-xs text-error" role="alert">
            {error}
          </p>
        )}

        {successMessage && (
          <p className="text-xs text-green-600" role="status">
            {successMessage}
          </p>
        )}

        <p className="text-sm text-muted-foreground">
          Pas reçu ?{" "}
          <button
            type="button"
            onClick={handleResend}
            disabled={resendCooldown > 0}
            className="font-semibold text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {resendCooldown > 0 ? `Renvoyer (${resendCooldown}s)` : "Renvoyer le code"}
          </button>
        </p>
      </div>
    );
  }

  // ─── Étape Email ───────────────────────────────────────────
  return (
    <div className="page-enter space-y-6">
      <Link
        href="/login"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground rounded-lg p-1"
      >
        <ArrowLeft className="h-5 w-5" />
        <span>Retour</span>
      </Link>

      <div>
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
          <Mail className="h-7 w-7 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
          Mot de passe oublié ?
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Entrez votre email ou téléphone pour recevoir un code de réinitialisation.
        </p>
      </div>

      {/* Onglets email / téléphone */}
      <div className="flex gap-2 rounded-xl border border-border bg-muted/30 p-1">
        <button
          type="button"
          onClick={() => { setForgotMethod("email"); setError(""); }}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all duration-200 ${
            forgotMethod === "email"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Mail className="h-4 w-4" />
          Email
        </button>
        <button
          type="button"
          onClick={() => { setForgotMethod("phone"); setError(""); }}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all duration-200 ${
            forgotMethod === "phone"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Phone className="h-4 w-4" />
          Téléphone
        </button>
      </div>

      <form onSubmit={handleSendEmail} className="space-y-5" noValidate>
        {forgotMethod === "email" ? (
          <div className="space-y-1.5">
            <label htmlFor="forgot-email" className="text-sm font-medium text-foreground">
              Adresse email
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                id="forgot-email"
                type="email"
                value={emailValue}
                onChange={(e) => { setEmailValue(e.target.value); setError(""); }}
                placeholder="votre@email.com"
                autoComplete="email"
                autoFocus
                className="h-12 w-full rounded-xl border border-border bg-background pl-11 pr-4 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-1.5">
            <label htmlFor="forgot-phone" className="text-sm font-medium text-foreground">
              Numéro de téléphone
            </label>
            <div className="flex items-center rounded-xl border border-border bg-background transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
              <div className="flex items-center border-r border-border pl-2 pr-1">
                <CountryCodeSelector countryCodes={mockCountryCodes} value={selectedCountry} onChange={setSelectedCountry} />
                <span className="text-xs text-muted-foreground pr-2 select-none">{selectedCountry.dialCode}</span>
              </div>
              <input
                id="forgot-phone"
                type="tel"
                value={phoneValue}
                onChange={(e) => { setPhoneValue(e.target.value); setError(""); }}
                placeholder="70 00 00 00"
                autoComplete="tel-national"
                className="h-12 flex-1 border-none bg-transparent pl-3 pr-4 text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
            </div>
          </div>
        )}

        {error && (
          <p className="text-xs text-error" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-dark active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <><Loader2 className="h-4 w-4 animate-spin" /><span>Envoi...</span></>
          ) : (
            <><span>Envoyer le code</span><ArrowRight className="h-4 w-4" /></>
          )}
        </button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Vous vous souvenez de votre mot de passe ?{" "}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Se connecter
        </Link>
      </p>
    </div>
  );
}

export { ForgotPasswordPageClient };
