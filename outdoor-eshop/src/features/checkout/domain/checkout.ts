export const SHIPPING_METHOD_CODES = [
  "courier",
  "pickup",
] as const;

export type ShippingMethodCode = (typeof SHIPPING_METHOD_CODES)[number];

export const PAYMENT_METHOD_CODES = ["cod"] as const;

export type PaymentMethodCode = (typeof PAYMENT_METHOD_CODES)[number];

export function isShippingMethodCode(value: unknown): value is ShippingMethodCode {
  return SHIPPING_METHOD_CODES.some((code) => code === value);
}

export function isPaymentMethodCode(value: unknown): value is PaymentMethodCode {
  return PAYMENT_METHOD_CODES.some((code) => code === value);
}

export type CheckoutDetails = {
  email: string;
  firstName: string;
  lastName: string;
  street: string;
  city: string;
  postalCode: string;
  phone: string;
  country: string;
  note: string;
  shippingMethod: ShippingMethodCode;
};
