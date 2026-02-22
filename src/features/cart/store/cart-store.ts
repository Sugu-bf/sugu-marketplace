"use client";

import { create } from "zustand";
import type { CartItem } from "../models/cart";

interface CartState {
  items: CartItem[];
  couponCode: string | null;
  addItem: (item: CartItem) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  applyCoupon: (code: string) => void;
  removeCoupon: () => void;
  itemCount: () => number;
  subtotal: () => number;
  totalDiscount: () => number;
  total: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  couponCode: null,

  addItem: (item) =>
    set((state) => {
      const existing = state.items.find((i) => i.productId === item.productId);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.productId === item.productId
              ? { ...i, quantity: i.quantity + item.quantity }
              : i
          ),
        };
      }
      return { items: [...state.items, item] };
    }),

  removeItem: (productId) =>
    set((state) => ({
      items: state.items.filter((i) => i.productId !== productId),
    })),

  updateQuantity: (productId, quantity) =>
    set((state) => ({
      items:
        quantity <= 0
          ? state.items.filter((i) => i.productId !== productId)
          : state.items.map((i) =>
              i.productId === productId ? { ...i, quantity } : i
            ),
    })),

  clearCart: () => set({ items: [], couponCode: null }),

  applyCoupon: (code) => set({ couponCode: code }),

  removeCoupon: () => set({ couponCode: null }),

  itemCount: () => get().items.reduce((acc, i) => acc + i.quantity, 0),

  subtotal: () => get().items.reduce((acc, i) => acc + i.price * i.quantity, 0),

  totalDiscount: () =>
    get().items.reduce((acc, i) => {
      const discount = i.originalPrice ? (i.originalPrice - i.price) * i.quantity : 0;
      return acc + discount;
    }, 0),

  total: () => {
    const subtotal = get().subtotal();
    return subtotal; // shipping is free for now
  },
}));
