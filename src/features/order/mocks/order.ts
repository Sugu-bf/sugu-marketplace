import type { TrackedOrder } from "../models/order";

/**
 * Mock tracked order data — for design-only rendering and tests.
 * Now matches the new TrackedOrder shape with API-compatible fields.
 */
export function getMockTrackedOrder(): TrackedOrder {
  return {
    orderNumber: "SGU-2026-04821",
    status: "shipping",

    trackingSteps: [
      {
        id: "confirmed",
        label: "Confirmée",
        status: "completed",
        date: "2026-02-20T10:30:00",
        dateLabel: "20 Fév, 10:30",
      },
      {
        id: "preparing",
        label: "En préparation",
        status: "completed",
        date: "2026-02-20T14:15:00",
        dateLabel: "20 Fév, 14:15",
      },
      {
        id: "shipping",
        label: "En livraison",
        status: "current",
        date: "2026-02-21T09:00:00",
        dateLabel: "21 Fév, 09:00",
      },
      {
        id: "delivered",
        label: "Livrée",
        status: "upcoming",
        date: null,
        dateLabel: "Estimé : 22 Fév",
      },
    ],

    timeline: [
      {
        id: "ev-1",
        date: "21 Fév 09:00",
        description: "Colis pris en charge par le livreur Abdoulaye K.",
        isLatest: true,
      },
      {
        id: "ev-2",
        date: "20 Fév 14:15",
        description: "Commande préparée et emballée",
        isLatest: false,
      },
      {
        id: "ev-3",
        date: "20 Fév 12:00",
        description: "Préparation de votre commande en cours",
        isLatest: false,
      },
      {
        id: "ev-4",
        date: "20 Fév 10:30",
        description: "Commande confirmée et paiement reçu",
        isLatest: false,
      },
    ],

    // Delivery info
    agencyName: "Livo Express",
    agencyRating: 4.7,
    shippingMethod: "Livraison Express (24h)",
    deliveryAddress:
      "Mamadou Diallo, 123 Rue de la Paix, Ouagadougou, Burkina Faso",
    driver: {
      name: "Abdoulaye K.",
      phone: "+94 83 683 7923",
    },

    // Estimated delivery
    estimatedDate: "22 Février 2026",
    estimatedTimeRange: "Entre 10h et 14h",
    deliveryProgress: 70,

    // Order items
    items: [
      {
        id: "item-1",
        name: "Mangues Kent (5 kg)",
        quantity: 3,
        price: 5000,
        total: 15000,
        image: "/products/oranges.png",
      },
      {
        id: "item-2",
        name: "Plantains mûrs",
        quantity: 3,
        price: 4500,
        total: 13500,
        image: "/products/limes.png",
      },
      {
        id: "item-3",
        name: "Huile de Palme Rouge (1L)",
        quantity: 1,
        price: 3000,
        total: 3000,
        image: "/products/apple.png",
      },
    ],

    // Pricing
    subtotal: 12500,
    shippingCost: 3500,
    shippingLabel: "Express",
    discount: 1200,
    total: 14800,
    paymentMethod: "Mobile Money",
    paymentStatus: "paid",
    codMixte: null,
  };
}
