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

// ─── OTP Verification ───────────────────────────────────────
export const OtpVerificationSchema = z.object({
  code: z.string().length(4, "Le code doit contenir 4 chiffres"),
  destination: z.string(), // email or phone number
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
export const RegisterSchema = z
  .object({
    firstName: z.string().min(2, "Prénom requis"),
    lastName: z.string().min(2, "Nom requis"),
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
  id: z.number(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  phone: z.string(),
  avatar: z.string().optional(),
  createdAt: z.string(),
});

// ─── Inferred types ──────────────────────────────────────────
export type LoginInput = z.infer<typeof LoginSchema>;
export type LoginEmailInput = z.infer<typeof LoginEmailSchema>;
export type LoginPhoneInput = z.infer<typeof LoginPhoneSchema>;
export type OtpVerificationInput = z.infer<typeof OtpVerificationSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type User = z.infer<typeof UserSchema>;
