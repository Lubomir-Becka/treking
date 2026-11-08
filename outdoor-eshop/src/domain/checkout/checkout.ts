export const SHIPPING_METHOD_CODES = [
  "packeta",
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

export type CheckoutStep = 1 | 2 | 3 | 4;
export type CheckoutRouteStep =
  | "cart"
  | "shipping"
  | "payment"
  | "confirmation";

export function isCheckoutRouteStep(value: string): value is CheckoutRouteStep {
  return (
    value === "cart" ||
    value === "shipping" ||
    value === "payment" ||
    value === "confirmation"
  );
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

export type ShippingMethod = {
  code: ShippingMethodCode;
  name: string;
  description: string;
  price: number;
};

export const shippingMethods: ShippingMethod[] = [
  {
    code: "packeta",
    name: "Packeta Z-BOX & výdajné miesto",
    description: "Vyzdvihnutie kedykoľvek v dostupnej sieti.",
    price: 0,
  },
  {
    code: "courier",
    name: "Kuriér na adresu",
    description: "Rýchle doručenie priamo k vám.",
    price: 0,
  },
  {
    code: "pickup",
    name: "Osobný odber Ateliér Tatranská Lomnica",
    description: "Odborné nastavenie výstroja na mieste.",
    price: 0,
  },
];

export const checkoutSteps = [
  { number: 1, label: "Košík & prehľad", href: "/checkout/cart" },
  { number: 2, label: "Doprava & adresa", href: "/checkout/shipping" },
  { number: 3, label: "Dokončenie", href: "/checkout/payment" },
] as const;
