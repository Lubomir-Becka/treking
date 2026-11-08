import type { CreateOrderInput } from "./OrderRepository";
import { isPaymentMethodCode, isShippingMethodCode } from "./checkout";

export function isValidCustomerEmail(value: string) {
  const email = value.trim();
  if (email.length > 100) return false;

  const parts = email.split("@");
  if (parts.length !== 2) return false;
  const [localPart, domain] = parts;
  if (
    !localPart ||
    localPart.length > 64 ||
    localPart.startsWith(".") ||
    localPart.endsWith(".") ||
    localPart.includes("..") ||
    !/^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+$/.test(localPart)
  ) {
    return false;
  }

  const labels = domain.split(".");
  return (
    labels.length > 1 &&
    labels[labels.length - 1].length >= 2 &&
    labels.every(
      (label) =>
        label.length > 0 &&
        label.length <= 63 &&
        /^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?$/.test(label),
    )
  );
}

export function isValidCreateOrderInput(input: CreateOrderInput) {
  const email = input.email.trim();
  return (
    isValidCustomerEmail(email) &&
    input.firstName.trim().length > 0 &&
    input.firstName.length <= 100 &&
    input.lastName.trim().length > 0 &&
    input.lastName.length <= 100 &&
    input.street.trim().length > 0 &&
    input.street.length <= 150 &&
    input.city.trim().length > 0 &&
    input.city.length <= 100 &&
    input.postalCode.trim().length > 0 &&
    input.postalCode.length <= 20 &&
    input.phone.trim().length >= 7 &&
    input.phone.length <= 20 &&
    `${input.firstName.trim()} ${input.lastName.trim()}`.length <= 100 &&
    (input.country === undefined || /^[A-Za-z]{2}$/.test(input.country)) &&
    (input.note === undefined || input.note.length <= 2000) &&
    isShippingMethodCode(input.shippingMethod) &&
    isPaymentMethodCode(input.paymentMethod)
  );
}
