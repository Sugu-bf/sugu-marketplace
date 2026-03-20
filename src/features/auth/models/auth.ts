import { z } from "zod";

// ─── Auth Methods ────────────────────────────────────────────
export const AuthMethodSchema = z.enum(["email", "phone"]);
export type AuthMethod = z.infer<typeof AuthMethodSchema>;

// ─── Login Schemas ───────────────────────────────────────────
export const LoginEmailSchema = z.object({
  method: z.literal("email"),
  email: z.string().email("Email invalide"),
});

export const LoginPhoneSchema = z.object({
  method: z.literal("phone"),
  countryCode: z.string().default("+1"),
  phone: z.string().min(8, "Numéro de téléphone invalide"),
});

export const LoginSchema = z.discriminatedUnion("method", [
  LoginEmailSchema,
  LoginPhoneSchema,
]);

// ─── OTP Verification ─────────────────────────────────────────
// Web: 6 chiffres (email OTP) | Mobile: 4-6 chiffres (SMS Ikoddi)
export const OtpVerificationSchema = z.object({
  code: z.string().length(6, "Le code doit contenir 6 chiffres"),
  destination: z.string(), // email ou numéro de téléphone
  method: AuthMethodSchema,
});

// ─── Social Providers ────────────────────────────────────────
export const SocialProviderSchema = z.enum(["meta", "google"]);
export type SocialProvider = z.infer<typeof SocialProviderSchema>;

// ─── Country codes ───────────────────────────────────────────
export const CountryCodeSchema = z.object({
  code: z.string(),
  dialCode: z.string(),
  flag: z.string(),
  name: z.string(),
});
export type CountryCode = z.infer<typeof CountryCodeSchema>;

// ─── Register ────────────────────────────────────────────────
// Aligné sur le backend : un seul champ "name" (nom complet)
export const RegisterSchema = z
  .object({
    name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
    email: z.string().email("Email invalide"),
    phone: z.string().min(8, "Numéro de téléphone invalide"),
    password: z
      .string()
      .min(8, "Le mot de passe doit contenir au moins 8 caractères"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

// ─── User ────────────────────────────────────────────────────
export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email().nullable(),
  phone_e164: z.string().nullable().optional(),
  avatar_url: z.string().nullable().optional(),
  email_verified: z.boolean().optional(),
  phone_verified: z.boolean().optional(),
  status: z.string().optional(),
  user_type: z.string().optional(),
  roles: z.array(z.string()).optional(),
  store: z
    .object({
      id: z.string(),
      name: z.string(),
      slug: z.string(),
      logo_url: z.string().nullable(),
    })
    .nullable()
    .optional(),
  created_at: z.string(),
});

// ─── Inferred types ──────────────────────────────────────────
export type LoginInput = z.infer<typeof LoginSchema>;
export type LoginEmailInput = z.infer<typeof LoginEmailSchema>;
export type LoginPhoneInput = z.infer<typeof LoginPhoneSchema>;
export type OtpVerificationInput = z.infer<typeof OtpVerificationSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type User = z.infer<typeof UserSchema>;
