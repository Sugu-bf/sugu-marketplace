import type { TrustBadge } from "../models/home";
import { CONTACT } from "@/lib/constants";

/**
 * Trust badges shown above the footer of every page.
 *
 * Only what the marketplace actually does: a published product belongs to a
 * verified store (Product::scopePublished), every order has its tracking
 * page, online payment goes through Mobile Money, and the support answers at
 * the one public address. The former badges promised free delivery
 * everywhere, a 24/7 support and "100 % satisfaction", none of which is true.
 */
export const TRUST_BADGES: TrustBadge[] = [
  { iconName: "award", title: "Vendeurs vérifiés", subtitle: "Chaque boutique est vérifiée avant de vendre" },
  { iconName: "truck", title: "Suivi de commande", subtitle: "Chaque étape jusqu'à la livraison" },
  { iconName: "shield-check", title: "Paiement Mobile Money", subtitle: "Payez avec votre compte Mobile Money" },
  { iconName: "headphones", title: "Une question ?", subtitle: `Écrivez à ${CONTACT.email}` },
];
