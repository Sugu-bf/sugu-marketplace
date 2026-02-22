import type {
  DeliveryAgency,
  ShippingMethod,
  ShippingAddress,
  OrderSummaryItem,
  CheckoutPageData,
} from "../models/checkout";

// ─── Delivery Agencies ───────────────────────────────────────

export const mockDeliveryAgencies: DeliveryAgency[] = [
  {
    id: "livo-express",
    name: "Livo Express",
    description: "Livraison rapide dans tout le Burkina Faso",
    logo: "/brands/livo.png",
    rating: 4.7,
    reviewCount: 1243,
  },
  {
    id: "fastrak-bf",
    name: "Fastrak BF",
    description: "Spécialiste de la livraison urbaine à Ouagadougou",
    logo: "/brands/fastrak.png",
    rating: 4.5,
    reviewCount: 876,
  },
  {
    id: "sahel-delivery",
    name: "Sahel Delivery",
    description: "Couverture nationale et transfrontalière",
    logo: "/brands/sahel.png",
    rating: 4.3,
    reviewCount: 534,
  },
];

// ─── Shipping Methods (per agency) ───────────────────────────

export const mockShippingMethods: ShippingMethod[] = [
  // Livo Express methods
  {
    id: "livo-standard",
    agencyId: "livo-express",
    name: "Livraison Standard",
    description: "3-5 jours ouvrés",
    price: 1500,
    estimatedDays: "3-5 jours",
    icon: "truck",
  },
  {
    id: "livo-express",
    agencyId: "livo-express",
    name: "Livraison Express",
    description: "24h",
    price: 3500,
    estimatedDays: "24h",
    icon: "zap",
  },
  {
    id: "livo-pickup",
    agencyId: "livo-express",
    name: "Retrait en agence",
    description: "Gratuit",
    price: 0,
    estimatedDays: "Disponible maintenant",
    icon: "store",
  },

  // Fastrak BF methods
  {
    id: "fastrak-standard",
    agencyId: "fastrak-bf",
    name: "Livraison Standard",
    description: "2-4 jours ouvrés",
    price: 1200,
    estimatedDays: "2-4 jours",
    icon: "truck",
  },
  {
    id: "fastrak-express",
    agencyId: "fastrak-bf",
    name: "Livraison Express",
    description: "Même jour",
    price: 4000,
    estimatedDays: "Même jour",
    icon: "zap",
  },

  // Sahel Delivery methods
  {
    id: "sahel-standard",
    agencyId: "sahel-delivery",
    name: "Livraison Standard",
    description: "5-7 jours ouvrés",
    price: 1000,
    estimatedDays: "5-7 jours",
    icon: "truck",
  },
  {
    id: "sahel-express",
    agencyId: "sahel-delivery",
    name: "Livraison Rapide",
    description: "48h",
    price: 2500,
    estimatedDays: "48h",
    icon: "zap",
  },
  {
    id: "sahel-pickup",
    agencyId: "sahel-delivery",
    name: "Retrait en point relais",
    description: "Gratuit",
    price: 0,
    estimatedDays: "2-3 jours",
    icon: "store",
  },
];

// ─── Saved Addresses ─────────────────────────────────────────

export const mockSavedAddresses: ShippingAddress[] = [
  {
    id: 1,
    label: "Maison",
    fullName: "Mamadou Diallo",
    street: "123 Rue de la Paix",
    city: "Abidjan",
    country: "Côte d'Ivoire",
    phone: "+225 07 00 00 00",
    isDefault: true,
  },
  {
    id: 2,
    label: "Bureau",
    fullName: "Mamadou Diallo",
    street: "45 Avenue Kwame Nkrumah",
    city: "Ouagadougou",
    country: "Burkina Faso",
    phone: "+226 70 00 00 00",
    isDefault: false,
  },
  {
    id: 3,
    label: "Famille",
    fullName: "Aïssata Diallo",
    street: "78 Boulevard de la Résistance",
    city: "Bobo-Dioulasso",
    country: "Burkina Faso",
    phone: "+226 76 00 00 00",
    isDefault: false,
  },
];

// ─── Order Items ─────────────────────────────────────────────

export const mockOrderItems: OrderSummaryItem[] = [
  {
    productId: 1,
    name: "Mangues Kent (5 kg)",
    quantity: 1,
    price: 5000,
    thumbnail: "/products/oranges.png",
  },
  {
    productId: 2,
    name: "Plantains mûrs (3 régimes)",
    quantity: 1,
    price: 4500,
    thumbnail: "/products/limes.png",
  },
  {
    productId: 3,
    name: "Huile de Palme Rouge (1L)",
    quantity: 1,
    price: 3000,
    thumbnail: "/products/apple.png",
  },
];

// ─── Full Checkout Page Data ─────────────────────────────────

export function getMockCheckoutData(): CheckoutPageData {
  const subtotal = mockOrderItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );
  const discount = 1200;
  const defaultAddress = mockSavedAddresses.find((a) => a.isDefault);

  return {
    currentStep: "shipping",
    completedSteps: ["cart", "address"],
    deliveryAgencies: mockDeliveryAgencies,
    shippingMethods: mockShippingMethods,
    selectedAgencyId: null,          // nothing pre-selected
    selectedShippingMethodId: null,
    savedAddresses: mockSavedAddresses,
    selectedAddressId: defaultAddress?.id ?? null,
    orderItems: mockOrderItems,
    subtotal,
    shippingCost: 0,
    discount,
    total: subtotal - discount,
    couponCode: null,
  };
}
