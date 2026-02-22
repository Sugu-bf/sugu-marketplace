import { z } from "zod";

// ─── Address ─────────────────────────────────────────────────

export const AddressSchema = z.object({
  id: z.number(),
  label: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  phone: z.string(),
  street: z.string(),
  city: z.string(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().default("Burkina Faso"),
  isDefault: z.boolean().default(false),
});

// ─── Order Item ──────────────────────────────────────────────

export const OrderItemSchema = z.object({
  productId: z.number(),
  name: z.string(),
  price: z.number(),
  quantity: z.number(),
  thumbnail: z.string(),
});

// ─── Order ───────────────────────────────────────────────────

export const OrderSchema = z.object({
  id: z.string(),
  items: z.array(OrderItemSchema),
  subtotal: z.number(),
  shippingFee: z.number(),
  total: z.number(),
  status: z.enum(["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"]),
  createdAt: z.string(),
  estimatedDelivery: z.string().optional(),
  trackingNumber: z.string().optional(),
  shippingAddress: AddressSchema,
});

// ─── User Profile ────────────────────────────────────────────

export const UserProfileSchema = z.object({
  id: z.number(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  emailVerified: z.boolean(),
  phone: z.string(),
  dateOfBirth: z.string(),
  gender: z.enum(["male", "female", "other"]),
  avatar: z.string().nullable(),
  createdAt: z.string(),
});

// ─── Security Info ───────────────────────────────────────────

export const SecurityInfoSchema = z.object({
  passwordLastChanged: z.string(),
  twoFactorEnabled: z.boolean(),
});

// ─── User Preferences ────────────────────────────────────────

export const UserPreferencesSchema = z.object({
  newsletterSubscribed: z.boolean(),
  pushNotifications: z.boolean(),
  smsNotifications: z.boolean(),
  language: z.string(),
  currency: z.string(),
});

// ─── Account Page Data ──────────────────────────────────────

export const AccountPageDataSchema = z.object({
  profile: UserProfileSchema,
  security: SecurityInfoSchema,
  preferences: UserPreferencesSchema,
});

// ─── Payment Method ──────────────────────────────────────────

export const PaymentMethodSchema = z.object({
  id: z.number(),
  type: z.enum(["mobile_money", "card", "bank"]),
  label: z.string(),
  details: z.string(),
  isDefault: z.boolean(),
  icon: z.string(),
});

// ─── Notification ────────────────────────────────────────────

export const NotificationSchema = z.object({
  id: z.number(),
  type: z.enum(["order", "promo", "system", "delivery"]),
  title: z.string(),
  message: z.string(),
  date: z.string(),
  read: z.boolean(),
});

// ─── Coupon ──────────────────────────────────────────────────

export const CouponSchema = z.object({
  id: z.number(),
  code: z.string(),
  description: z.string(),
  discountType: z.enum(["percentage", "fixed"]),
  discountValue: z.number(),
  minOrder: z.number(),
  expiresAt: z.string(),
  isUsed: z.boolean(),
});

// ─── Referral ────────────────────────────────────────────────

export const ReferralDataSchema = z.object({
  referralCode: z.string(),
  referralLink: z.string(),
  totalReferred: z.number(),
  totalEarnings: z.number(),
  rewardPerReferral: z.number(),
  referredUsers: z.array(
    z.object({
      name: z.string(),
      date: z.string(),
      status: z.enum(["pending", "completed"]),
    })
  ),
});

// ─── Help Center ─────────────────────────────────────────────

export const FaqItemSchema = z.object({
  id: z.number(),
  question: z.string(),
  answer: z.string(),
  category: z.string(),
});

// ─── Derived Types ───────────────────────────────────────────

export type Address = z.infer<typeof AddressSchema>;
export type OrderItem = z.infer<typeof OrderItemSchema>;
export type Order = z.infer<typeof OrderSchema>;
export type OrderStatus = Order["status"];
export type UserProfile = z.infer<typeof UserProfileSchema>;
export type SecurityInfo = z.infer<typeof SecurityInfoSchema>;
export type UserPreferences = z.infer<typeof UserPreferencesSchema>;
export type AccountPageData = z.infer<typeof AccountPageDataSchema>;
export type PaymentMethod = z.infer<typeof PaymentMethodSchema>;
export type Notification = z.infer<typeof NotificationSchema>;
export type Coupon = z.infer<typeof CouponSchema>;
export type ReferralData = z.infer<typeof ReferralDataSchema>;
export type FaqItem = z.infer<typeof FaqItemSchema>;
