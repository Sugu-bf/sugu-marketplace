import type { AccountPageData, Address, Order, PaymentMethod, Notification, Coupon, ReferralData, FaqItem } from "../models/account";
import {
  getMockAccountPageData, getMockAddresses, getMockOrders,
  getMockPaymentMethods, getMockNotifications, getMockCoupons,
  getMockReferralData, getMockFaqItems,
} from "../mocks/account";

export async function queryAccountPageData(): Promise<AccountPageData> { return getMockAccountPageData(); }
export async function queryAddresses(): Promise<Address[]> { return getMockAddresses(); }
export async function queryOrders(): Promise<Order[]> { return getMockOrders(); }
export async function queryPaymentMethods(): Promise<PaymentMethod[]> { return getMockPaymentMethods(); }
export async function queryNotifications(): Promise<Notification[]> { return getMockNotifications(); }
export async function queryCoupons(): Promise<Coupon[]> { return getMockCoupons(); }
export async function queryReferralData(): Promise<ReferralData> { return getMockReferralData(); }
export async function queryFaqItems(): Promise<FaqItem[]> { return getMockFaqItems(); }
