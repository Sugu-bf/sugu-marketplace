import type {
  Address, Order, UserProfile, SecurityInfo, UserPreferences,
  AccountPageData, PaymentMethod, Notification, Coupon, ReferralData, FaqItem,
} from "../models/account";

// ─── Addresses ───────────────────────────────────────────────

export const mockAddresses: Address[] = [
  { id: 1, label: "Domicile", firstName: "Mamadou", lastName: "Diallo", phone: "+226 70 00 00 00", street: "Rue 15.42, Secteur 15", city: "Ouagadougou", country: "Burkina Faso", isDefault: true },
  { id: 2, label: "Bureau", firstName: "Mamadou", lastName: "Diallo", phone: "+226 70 00 00 01", street: "Avenue Kwamé Nkrumah, Immeuble SONAPOST", city: "Ouagadougou", country: "Burkina Faso", isDefault: false },
  { id: 3, label: "Famille", firstName: "Aïssata", lastName: "Diallo", phone: "+226 76 00 00 00", street: "Secteur 22, Quartier Dassasgho", city: "Ouagadougou", country: "Burkina Faso", isDefault: false },
];

// ─── Orders ──────────────────────────────────────────────────

export const mockOrders: Order[] = [
  {
    id: "ORD-2026-001", status: "shipped", createdAt: "2026-02-18T10:30:00Z",
    estimatedDelivery: "2026-02-22T18:00:00Z", trackingNumber: "TRK-BF-001",
    items: [
      { productId: 1, name: "Fraises Fraîches Bio", price: 2500, quantity: 2, thumbnail: "/products/strawberries.png" },
      { productId: 2, name: "Oranges Navel Premium", price: 1800, quantity: 1, thumbnail: "/products/oranges.png" },
    ],
    subtotal: 6800, shippingFee: 500, total: 7300, shippingAddress: mockAddresses[0],
  },
  {
    id: "ORD-2026-002", status: "delivered", createdAt: "2026-02-10T14:00:00Z",
    items: [
      { productId: 4, name: "Raisins Rouges sans Pépins", price: 3200, quantity: 3, thumbnail: "/products/grapes.png" },
    ],
    subtotal: 9600, shippingFee: 500, total: 10100, shippingAddress: mockAddresses[0],
  },
  {
    id: "ORD-2026-003", status: "processing", createdAt: "2026-02-20T09:00:00Z",
    items: [
      { productId: 5, name: "Mangues Kent (5 kg)", price: 5000, quantity: 1, thumbnail: "/products/oranges.png" },
      { productId: 6, name: "Huile de Palme Rouge (1L)", price: 3000, quantity: 2, thumbnail: "/products/apple.png" },
    ],
    subtotal: 11000, shippingFee: 1500, total: 12500, shippingAddress: mockAddresses[1],
  },
  {
    id: "ORD-2026-004", status: "cancelled", createdAt: "2026-02-05T16:00:00Z",
    items: [
      { productId: 7, name: "Plantation de Bananes (2 kg)", price: 1500, quantity: 1, thumbnail: "/products/limes.png" },
    ],
    subtotal: 1500, shippingFee: 500, total: 2000, shippingAddress: mockAddresses[0],
  },
];

// ─── User Profile ────────────────────────────────────────────

export const mockUserProfile: UserProfile = {
  id: 1, firstName: "Mamadou", lastName: "Diallo", email: "mamadou@email.com",
  emailVerified: true, phone: "+226 70 00 00 00", dateOfBirth: "15/03/1990",
  gender: "male", avatar: null, createdAt: "2025-06-15T10:00:00Z",
};

export const mockSecurityInfo: SecurityInfo = { passwordLastChanged: "Il y a 3 mois", twoFactorEnabled: false };

export const mockUserPreferences: UserPreferences = {
  newsletterSubscribed: true, pushNotifications: true, smsNotifications: false,
  language: "Français", currency: "FCFA (XOF)",
};

// ─── Payment Methods ─────────────────────────────────────────

export const mockPaymentMethods: PaymentMethod[] = [
  { id: 1, type: "mobile_money", label: "Orange Money", details: "+226 70 •• •• 00", isDefault: true, icon: "smartphone" },
  { id: 2, type: "mobile_money", label: "Moov Money", details: "+226 76 •• •• 01", isDefault: false, icon: "smartphone" },
  { id: 3, type: "card", label: "Visa", details: "•••• •••• •••• 4521", isDefault: false, icon: "credit-card" },
];

// ─── Notifications ───────────────────────────────────────────

export const mockNotifications: Notification[] = [
  { id: 1, type: "delivery", title: "Commande en route", message: "Votre commande ORD-2026-001 est en cours de livraison.", date: "Il y a 2h", read: false },
  { id: 2, type: "promo", title: "🔥 Offre flash -30%", message: "Profitez de -30% sur tous les fruits tropicaux pendant 24h !", date: "Il y a 5h", read: false },
  { id: 3, type: "order", title: "Commande confirmée", message: "Votre commande ORD-2026-003 a été confirmée.", date: "Hier", read: true },
  { id: 4, type: "system", title: "Bienvenue sur Sugu !", message: "Merci d'avoir rejoint la communauté Sugu. Découvrez nos meilleures offres.", date: "Il y a 3 jours", read: true },
  { id: 5, type: "delivery", title: "Commande livrée", message: "Votre commande ORD-2026-002 a été livrée avec succès.", date: "12 Fév", read: true },
];

// ─── Coupons ─────────────────────────────────────────────────

export const mockCoupons: Coupon[] = [
  { id: 1, code: "SUGU10", description: "10% de réduction sur votre commande", discountType: "percentage", discountValue: 10, minOrder: 5000, expiresAt: "2026-03-31", isUsed: false },
  { id: 2, code: "BIENVENUE", description: "1 500 FCFA offerts pour votre première commande", discountType: "fixed", discountValue: 1500, minOrder: 3000, expiresAt: "2026-04-15", isUsed: false },
  { id: 3, code: "FRUITS20", description: "20% sur les fruits frais", discountType: "percentage", discountValue: 20, minOrder: 2000, expiresAt: "2026-02-28", isUsed: true },
];

// ─── Referral ────────────────────────────────────────────────

export const mockReferralData: ReferralData = {
  referralCode: "MAMADOU2026",
  referralLink: "https://sugu.bf/r/MAMADOU2026",
  totalReferred: 5,
  totalEarnings: 7500,
  rewardPerReferral: 1500,
  referredUsers: [
    { name: "Fatou S.", date: "18 Fév 2026", status: "completed" },
    { name: "Ibrahim K.", date: "14 Fév 2026", status: "completed" },
    { name: "Aminata T.", date: "10 Fév 2026", status: "pending" },
    { name: "Ousmane B.", date: "05 Fév 2026", status: "completed" },
    { name: "Mariam O.", date: "01 Fév 2026", status: "completed" },
  ],
};

// ─── FAQ / Help Center ───────────────────────────────────────

export const mockFaqItems: FaqItem[] = [
  { id: 1, question: "Comment passer une commande ?", answer: "Ajoutez des produits à votre panier, accédez au panier, choisissez votre adresse et méthode de livraison, puis procédez au paiement.", category: "Commandes" },
  { id: 2, question: "Quels sont les délais de livraison ?", answer: "Les délais varient selon l'agence de livraison choisie : Standard (3-5 jours), Express (24h), ou retrait en agence.", category: "Livraison" },
  { id: 3, question: "Comment modifier ou annuler une commande ?", answer: "Vous pouvez modifier ou annuler votre commande tant qu'elle n'est pas en cours de préparation. Rendez-vous dans Mes commandes.", category: "Commandes" },
  { id: 4, question: "Quels modes de paiement acceptez-vous ?", answer: "Nous acceptons Orange Money, Moov Money, les cartes Visa/Mastercard et le paiement à la livraison.", category: "Paiement" },
  { id: 5, question: "Comment contacter le service client ?", answer: "Vous pouvez nous joindre par téléphone au +226 25 00 00 00, par WhatsApp, ou via le chat en ligne.", category: "Support" },
  { id: 6, question: "Puis-je retourner un produit ?", answer: "Oui, vous disposez de 48h après la livraison pour signaler un problème. Les produits frais doivent être signalés dans les 24h.", category: "Retours" },
];

// ─── Aggregated getters ──────────────────────────────────────

export function getMockAccountPageData(): AccountPageData {
  return { profile: mockUserProfile, security: mockSecurityInfo, preferences: mockUserPreferences };
}
export function getMockAddresses(): Address[] { return mockAddresses; }
export function getMockOrders(): Order[] { return mockOrders; }
export function getMockPaymentMethods(): PaymentMethod[] { return mockPaymentMethods; }
export function getMockNotifications(): Notification[] { return mockNotifications; }
export function getMockCoupons(): Coupon[] { return mockCoupons; }
export function getMockReferralData(): ReferralData { return mockReferralData; }
export function getMockFaqItems(): FaqItem[] { return mockFaqItems; }
