import type { CreateOrderInput } from "./OrderRepository";
import { isPaymentMethodCode, isShippingMethodCode } from "./checkout";
import { isValidCustomerEmail } from "../../../shared/domain/email";

export function isValidOrderDetails(input: Omit<CreateOrderInput, "userId" | "paymentMethod">) {
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
    isShippingMethodCode(input.shippingMethod)
  );
}

export function isValidCreateOrderInput(input: CreateOrderInput) {
  return isValidOrderDetails(input) && isPaymentMethodCode(input.paymentMethod);
}
