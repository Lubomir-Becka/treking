import { isShippingMethodCode, type CheckoutDetails } from "@/features/checkout/domain/checkout";
import type { CreatedOrder } from "./client";

const DETAILS_KEY = "vertex-checkout-details";
const ORDER_KEY = "vertex-checkout-order";

export function readCheckoutDetails(storage: Storage): CheckoutDetails | null {
  const raw = storage.getItem(DETAILS_KEY);
  if (!raw) return null;
  const value: unknown = JSON.parse(raw);
  if (typeof value !== "object" || value === null) throw new Error("INVALID_CHECKOUT_DETAILS");
  const fields = value as Record<string, unknown>;
  if (
    typeof fields.email !== "string" ||
    typeof fields.firstName !== "string" ||
    typeof fields.lastName !== "string" ||
    typeof fields.street !== "string" ||
    typeof fields.city !== "string" ||
    typeof fields.postalCode !== "string" ||
    typeof fields.phone !== "string" ||
    typeof fields.country !== "string" ||
    typeof fields.note !== "string" ||
    !isShippingMethodCode(fields.shippingMethod)
  ) throw new Error("INVALID_CHECKOUT_DETAILS");
  return {
    email: fields.email,
    firstName: fields.firstName,
    lastName: fields.lastName,
    street: fields.street,
    city: fields.city,
    postalCode: fields.postalCode,
    phone: fields.phone,
    country: fields.country,
    note: fields.note,
    shippingMethod: fields.shippingMethod,
  };
}

export function writeCheckoutDetails(storage: Storage, details: CheckoutDetails) {
  storage.setItem(DETAILS_KEY, JSON.stringify(details));
}

export function readCreatedOrder(storage: Storage): CreatedOrder | null {
  const raw = storage.getItem(ORDER_KEY);
  if (!raw) return null;
  const value: unknown = JSON.parse(raw);
  if (
    typeof value !== "object" || value === null ||
    !("orderNumber" in value) || typeof value.orderNumber !== "string" ||
    !("totalPrice" in value) || typeof value.totalPrice !== "number" ||
    !Number.isFinite(value.totalPrice)
  ) throw new Error("INVALID_CREATED_ORDER");
  return { orderNumber: value.orderNumber, totalPrice: value.totalPrice };
}

export function writeCreatedOrder(storage: Storage, order: CreatedOrder) {
  storage.setItem(ORDER_KEY, JSON.stringify(order));
  storage.removeItem(DETAILS_KEY);
}
