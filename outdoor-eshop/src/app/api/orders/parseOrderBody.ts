import {
  isPaymentMethodCode,
  isShippingMethodCode,
} from "@/features/checkout/domain/checkout";
import type { CreateOrderInput } from "@/features/checkout/domain/OrderRepository";

export type OrderBodyInput = Omit<CreateOrderInput, "userId">;

function getString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseOrderBody(value: unknown): OrderBodyInput | null {
  if (!isRecord(value) || value.termsAccepted !== true) {
    return null;
  }

  const body = value;
  const email = getString(body.email);
  const firstName = getString(body.firstName);
  const lastName = getString(body.lastName);
  const street = getString(body.street);
  const city = getString(body.city);
  const postalCode = getString(body.postalCode);
  const phone = getString(body.phone);

  if (
    email === null ||
    firstName === null ||
    lastName === null ||
    street === null ||
    city === null ||
    postalCode === null ||
    phone === null
  ) {
    return null;
  }
  if (!isShippingMethodCode(body.shippingMethod)) {
    return null;
  }
  if (!isPaymentMethodCode(body.paymentMethod)) {
    return null;
  }
  const country = body.country === undefined ? undefined : getString(body.country);
  const note = body.note === undefined ? undefined : getString(body.note);
  if (country === null || note === null) {
    return null;
  }
  return {
    email,
    firstName,
    lastName,
    street,
    city,
    postalCode,
    phone,
    shippingMethod: body.shippingMethod,
    paymentMethod: body.paymentMethod,
    ...(country === undefined ? {} : { country }),
    ...(note === undefined ? {} : { note }),
  };
}
