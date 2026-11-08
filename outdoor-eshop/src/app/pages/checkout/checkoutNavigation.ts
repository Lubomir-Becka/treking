export type CheckoutStep = 1 | 2 | 3 | 4;
export type CheckoutRouteStep = "cart" | "shipping" | "payment" | "confirmation";

export function isCheckoutRouteStep(value: string): value is CheckoutRouteStep {
  return value === "cart" || value === "shipping" || value === "payment" || value === "confirmation";
}

export const checkoutSteps = [
  { number: 1, label: "Košík & prehľad", href: "/checkout/cart" },
  { number: 2, label: "Doprava & adresa", href: "/checkout/shipping" },
  { number: 3, label: "Dokončenie", href: "/checkout/payment" },
] as const;
