"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  Check,
  Mail,
  Phone,
  User,
  Lock,
  ShoppingBag,
  Store,
} from "lucide-react";
import { OtpInput } from "@/components/ui";
import {
  registerUser,
  verifyOtp,
  resendOtp,
  OTP_TYPE,
  getAuthErrorMessage,
} from "../services/auth-service";

type RegisterStep = "form" | "verify-email";

type UserType = "buyer" | "seller" | "both";

interface UserTypeOption {
  id: UserType;
  label: string;
  description: string;
  icon: typeof ShoppingBag;
}

const USER_TYPES: UserTypeOption[] = [
  {
    id: "buyer",
    label: "Acheteur",
    description: "Acheter des produits en ligne",
    icon: ShoppingBag,
  },
  {
    id: "seller",
    label: "Vendeur",
    description: "Vendre vos produits sur Sugu",
    icon: Store,
  },
  {
    id: "both",
    label: "Les deux",
    description: "Acheter et vendre",
    icon: User,
  },
];

function RegisterPageClient() {
  const router = useRouter();

  // Step management
  const [step, setStep] = useState<RegisterStep>("form");
  const [registeredEmail, setRegisteredEmail] = useState("");

  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [userType, setUserType] = useState<UserType>("buyer");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [otpError, setOtpError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  // ─── Validation ────────────────────────────────────────────
  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!name.trim()) errors.name = "Le nom est requis";
    else if (name.trim().length < 2) errors.name = "Le nom doit contenir au moins 2 caractères";

    if (!email.trim()) errors.email = "L'email est requis";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Email invalide";

    if (!phone.trim()) errors.phone = "Le téléphone est requis";
    else if (phone.replace(/\D/g, "").length < 8) errors.phone = "Numéro invalide";

    if (!password) errors.password = "Le mot de passe est requis";
    else if (password.length < 8) errors.password = "Minimum 8 caractères";

    if (!confirmPassword) errors.confirmPassword = "Confirmez le mot de passe";
    else if (password !== confirmPassword) errors.confirmPassword = "Les mots de passe ne correspondent pas";

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ─── Format phone to E.164 ────────────────────────────────
  const formatPhoneE164 = (rawPhone: string): string => {
    const cleaned = rawPhone.replace(/\s/g, "");
    if (cleaned.startsWith("+")) return cleaned;
    // Default to Burkina Faso if no prefix
    return `+226${cleaned}`;
  };

  // ─── Register Submit ───────────────────────────────────────
  const handleRegister = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError("");

      if (!validate()) return;

      setLoading(true);
      try {
        const result = await registerUser({
          name: name.trim(),
          email: email.trim(),
          phone_e164: formatPhoneE164(phone),
          password,
          password_confirmation: confirmPassword,
          user_type: userType,
        });

        // Store the token
        if (typeof window !== "undefined" && result.token) {
          document.cookie = `auth_token=${result.token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
        }

        // Go to email verification
        if (result.verification_required.email) {
          setRegisteredEmail(email.trim());
          setStep("verify-email");
        } else {
          router.push("/");
          router.refresh();
        }
      } catch (err) {
        setError(getAuthErrorMessage(err));
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [name, email, phone, password, confirmPassword, userType, router]
  );

  // ─── OTP Verify ────────────────────────────────────────────
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
        setSuccessMessage("Email vérifié avec succès !");
        setTimeout(() => {
          router.push("/");
          router.refresh();
        }, 1500);
      } catch (err) {
        setOtpError(getAuthErrorMessage(err));
      } finally {
        setLoading(false);
      }
    },
    [registeredEmail, router]
  );

  // ─── Resend OTP ────────────────────────────────────────────
  const handleResend = useCallback(async () => {
    if (resendCooldown > 0) return;
    setOtpError("");
    try {
      await resendOtp({
        identifier: registeredEmail,
        type: OTP_TYPE.EMAIL_VERIFICATION,
      });
      setSuccessMessage("Code renvoyé !");
      setTimeout(() => setSuccessMessage(""), 3000);

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
  }, [registeredEmail, resendCooldown]);

  const handleSkipVerification = useCallback(() => {
    router.push("/");
    router.refresh();
  }, [router]);

  // ─── Verify Email Step ─────────────────────────────────────
  if (step === "verify-email") {
    return (
      <div className="page-enter space-y-6">
        <button
          type="button"
          onClick={handleSkipVerification}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground rounded-lg p-1"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Passer</span>
        </button>

        <div>
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <Mail className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            Vérifiez votre email
          </h1>
          <div className="mt-3 rounded-xl border border-border bg-muted/50 px-4 py-3">
            <p className="text-sm text-muted-foreground">
              Un code à 6 chiffres a été envoyé à
            </p>
            <p className="mt-0.5 text-sm font-semibold text-foreground">
              {registeredEmail}
            </p>
          </div>
        </div>

        <div className="mt-8 flex justify-start">
          <OtpInput
            length={6}
            onChange={() => setOtpError("")}
            onComplete={handleVerifyEmail}
            error={!!otpError}
            disabled={loading}
          />
        </div>

        {otpError && (
          <p className="text-xs text-error" role="alert">
            {otpError}
          </p>
        )}

        {successMessage && (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <Check className="h-4 w-4" />
            <span>{successMessage}</span>
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

  // ─── Registration Form Step ────────────────────────────────
  return (
    <div className="page-enter space-y-6">
      {/* Mobile logo */}
      <div className="lg:hidden text-center mb-4">
        <span className="text-2xl font-black text-primary">Sugu</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
          Créer un compte
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Rejoignez Sugu et commencez à acheter dès aujourd&apos;hui.
        </p>
      </div>

      <form onSubmit={handleRegister} className="space-y-4" noValidate>
        {/* Name */}
        <div className="space-y-1.5">
          <label htmlFor="register-name" className="text-sm font-medium text-foreground">
            Nom complet
          </label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="register-name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (fieldErrors.name) setFieldErrors((f) => ({ ...f, name: "" }));
              }}
              placeholder="Amadou Ouédraogo"
              autoComplete="name"
              className={`h-12 w-full rounded-xl border bg-background pl-11 pr-4 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary ${
                fieldErrors.name ? "border-error" : "border-border"
              }`}
            />
          </div>
          {fieldErrors.name && <p className="text-xs text-error">{fieldErrors.name}</p>}
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <label htmlFor="register-email" className="text-sm font-medium text-foreground">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="register-email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldErrors.email) setFieldErrors((f) => ({ ...f, email: "" }));
              }}
              placeholder="votre@email.com"
              autoComplete="email"
              className={`h-12 w-full rounded-xl border bg-background pl-11 pr-4 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary ${
                fieldErrors.email ? "border-error" : "border-border"
              }`}
            />
          </div>
          {fieldErrors.email && <p className="text-xs text-error">{fieldErrors.email}</p>}
        </div>

        {/* Phone */}
        <div className="space-y-1.5">
          <label htmlFor="register-phone" className="text-sm font-medium text-foreground">
            Téléphone
          </label>
          <div className="relative">
            <Phone className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="register-phone"
              type="tel"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                if (fieldErrors.phone) setFieldErrors((f) => ({ ...f, phone: "" }));
              }}
              placeholder="+226 70 00 00 00"
              autoComplete="tel"
              className={`h-12 w-full rounded-xl border bg-background pl-11 pr-4 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary ${
                fieldErrors.phone ? "border-error" : "border-border"
              }`}
            />
          </div>
          {fieldErrors.phone && <p className="text-xs text-error">{fieldErrors.phone}</p>}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <label htmlFor="register-password" className="text-sm font-medium text-foreground">
            Mot de passe
          </label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="register-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldErrors.password) setFieldErrors((f) => ({ ...f, password: "" }));
              }}
              placeholder="••••••••"
              autoComplete="new-password"
              className={`h-12 w-full rounded-xl border bg-background pl-11 pr-12 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary ${
                fieldErrors.password ? "border-error" : "border-border"
              }`}
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
          {fieldErrors.password && <p className="text-xs text-error">{fieldErrors.password}</p>}
          {password && (
            <div className="flex gap-1 mt-1">
              {[
                password.length >= 8,
                /[A-Z]/.test(password),
                /[a-z]/.test(password),
                /\d/.test(password),
                /[^A-Za-z0-9]/.test(password),
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
          <label htmlFor="register-confirm-password" className="text-sm font-medium text-foreground">
            Confirmer le mot de passe
          </label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="register-confirm-password"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (fieldErrors.confirmPassword)
                  setFieldErrors((f) => ({ ...f, confirmPassword: "" }));
              }}
              placeholder="••••••••"
              autoComplete="new-password"
              className={`h-12 w-full rounded-xl border bg-background pl-11 pr-12 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary ${
                fieldErrors.confirmPassword ? "border-error" : "border-border"
              }`}
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
          {fieldErrors.confirmPassword && (
            <p className="text-xs text-error">{fieldErrors.confirmPassword}</p>
          )}
        </div>

        {/* User Type selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Type de compte
          </label>
          <div className="grid grid-cols-3 gap-2">
            {USER_TYPES.map(({ id, label, description, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setUserType(id)}
                className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 text-center transition-all duration-200 ${
                  userType === id
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border text-muted-foreground hover:border-muted-foreground/40"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs font-semibold">{label}</span>
                <span className="text-[10px] leading-tight opacity-70">{description}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Error message */}
        {error && (
          <p className="text-xs text-error" role="alert">
            {error}
          </p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-primary-dark active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Création...</span>
            </>
          ) : (
            <>
              <span>Créer mon compte</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>

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
