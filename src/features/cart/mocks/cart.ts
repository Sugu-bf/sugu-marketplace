import type { CartItem } from "../models/cart";

/**
 * Mock cart items for design-only rendering.
 * Used to populate the cart page with realistic data before the store is hydrated.
 */
export const mockCartItems: CartItem[] = [
  {
    productId: 1,
    slug: "fraises-fraiches-bio",
    name: "Fraises Fraîches Bio",
    price: 2500,
    originalPrice: 3500,
    quantity: 2,
    maxQuantity: 12,
    thumbnail: "/products/strawberries.png",
    vendorName: "Ferme du Soleil",
    variants: [
      { name: "Poids", value: "500g" },
      { name: "Conditionnement", value: "Barquette" },
    ],
  },
  {
    productId: 2,
    slug: "oranges-navel-premium",
    name: "Oranges Navel Premium",
    price: 1800,
    originalPrice: 2500,
    quantity: 1,
    maxQuantity: 45,
    thumbnail: "/products/oranges.png",
    vendorName: "Saveurs d'Afrique",
  },
  {
    productId: 4,
    slug: "raisins-rouges-sans-pepins",
    name: "Raisins Rouges sans Pépins",
    price: 3200,
    originalPrice: 4000,
    quantity: 3,
    maxQuantity: 8,
    thumbnail: "/products/grapes.png",
    vendorName: "Oasis Market",
  },
];

/**
 * Returns mock cart items for design-only rendering.
 */
export function getMockCartItems(): CartItem[] {
  return mockCartItems;
}
