/**
 * Account Query Functions — entry points for SSR data fetching.
 *
 * Called from Server Components. On error, redirects to login or throws.
 * No mock data — all queries hit the real backend API.
 */

import {
  fetchAccountPageData,
  fetchAddresses,
  fetchOrders,
  fetchNotifications,
  fetchReferralData,
} from "../api/account.api";
import type {
  AccountPageData,
  Address,
  PaginatedOrders,
  NotificationData,
  ReferralData,
  FaqItem,
} from "../api/account.types";
import { isApiError } from "@/lib/api";
import { redirect } from "next/navigation";

// ─── Static FAQ data (no backend endpoint needed) ────────────

const FAQ_ITEMS: FaqItem[] = [
  { id: 1, question: "Comment passer une commande ?", answer: "Ajoutez des produits à votre panier, accédez au panier, choisissez votre adresse et méthode de livraison, puis procédez au paiement.", category: "Commandes" },
  { id: 2, question: "Quels sont les délais de livraison ?", answer: "Les délais varient selon l'agence de livraison choisie : Standard (3-5 jours), Express (24h), ou retrait en agence.", category: "Livraison" },
  { id: 3, question: "Comment modifier ou annuler une commande ?", answer: "Vous pouvez modifier ou annuler votre commande tant qu'elle n'est pas en cours de préparation. Rendez-vous dans Mes commandes.", category: "Commandes" },
  { id: 4, question: "Quels modes de paiement acceptez-vous ?", answer: "Nous acceptons Orange Money, Moov Money, les cartes Visa/Mastercard et le paiement à la livraison.", category: "Paiement" },
  { id: 5, question: "Comment contacter le service client ?", answer: "Vous pouvez nous joindre par téléphone au +226 25 00 00 00, par WhatsApp, ou via le chat en ligne.", category: "Support" },
  { id: 6, question: "Puis-je retourner un produit ?", answer: "Oui, vous disposez de 48h après la livraison pour signaler un problème. Les produits frais doivent être signalés dans les 24h.", category: "Retours" },
];

// ─── Helpers ─────────────────────────────────────────────────

function handleAuthError(error: unknown): never {
  if (isApiError(error) && (error.status === 401 || error.code === "UNAUTHORIZED")) {
    redirect("/login?redirect=/account");
  }
  throw error;
}

// ─── Queries ─────────────────────────────────────────────────

export async function queryAccountPageData(): Promise<AccountPageData> {
  try {
    return await fetchAccountPageData();
  } catch (error) {
    console.error("[Account SSR] Failed to fetch account data:", (error as Error)?.message);
    handleAuthError(error);
  }
}

export async function queryAddresses(): Promise<Address[]> {
  try {
    return await fetchAddresses();
  } catch (error) {
    console.error("[Account SSR] Failed to fetch addresses:", (error as Error)?.message);
    handleAuthError(error);
  }
}

export async function queryOrders(params?: {
  page?: number;
  status?: string;
}): Promise<PaginatedOrders> {
  try {
    return await fetchOrders(params);
  } catch (error) {
    console.error("[Account SSR] Failed to fetch orders:", (error as Error)?.message);
    handleAuthError(error);
  }
}

export async function queryNotifications(cursor?: string): Promise<NotificationData> {
  try {
    return await fetchNotifications(cursor);
  } catch (error) {
    console.error("[Account SSR] Failed to fetch notifications:", (error as Error)?.message);
    handleAuthError(error);
  }
}

export async function queryReferralData(): Promise<ReferralData> {
  try {
    return await fetchReferralData();
  } catch (error) {
    console.error("[Account SSR] Failed to fetch referral data:", (error as Error)?.message);
    handleAuthError(error);
  }
}

export async function queryFaqItems(): Promise<FaqItem[]> {
  return FAQ_ITEMS;
}
