import type { CreateOrderInput } from "./OrderRepository";
import { isPaymentMethodCode, isShippingMethodCode } from "./checkout";
import { isValidCustomerEmail } from "../../../shared/domain/email";
import { isValidPhone } from "../../../shared/domain/contactValidation";

export function validateOrderDetails(input: Omit<CreateOrderInput, "userId" | "paymentMethod">): string | null {
  if (!isValidCustomerEmail(input.email)) return "Zadajte platnú e-mailovú adresu (najviac 100 znakov).";
  if (!isValidPhone(input.phone)) return "Zadajte platné telefónne číslo s aspoň 7 číslicami a najviac 20 znakmi.";
  const fields = [
    { value: input.firstName, label: "Meno", limit: 100 },
    { value: input.lastName, label: "Priezvisko", limit: 100 },
    { value: input.street, label: "Ulica a číslo domu", limit: 150 },
    { value: input.city, label: "Mesto", limit: 100 },
    { value: input.postalCode, label: "PSČ", limit: 20 },
  ];
  for (const field of fields) {
    if (!field.value.trim() || field.value.length > field.limit ||
      /[\u0000-\u001f\u007f-\u009f]/u.test(field.value)) {
      return `${field.label} je povinné, môže mať najviac ${field.limit} znakov a nesmie obsahovať riadiace znaky.`;
    }
  }
  if (`${input.firstName.trim()} ${input.lastName.trim()}`.length > 100) {
    return "Meno a priezvisko spolu môžu mať najviac 100 znakov vrátane medzery.";
  }
  if (input.country !== undefined && !/^[A-Za-z]{2}$/.test(input.country)) return "Krajina musí byť dvojpísmenový kód.";
  if ((input.country ?? "SK").toUpperCase() === "SK" && !/^\d{3} ?\d{2}$/.test(input.postalCode.trim())) {
    return "Slovenské PSČ musí obsahovať päť číslic, napríklad 058 01.";
  }
  if (input.note !== undefined && (input.note.length > 2000 ||
    /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f]/u.test(input.note))) {
    return "Poznámka môže mať najviac 2000 znakov a nesmie obsahovať nepovolené riadiace znaky.";
  }
  if (!isShippingMethodCode(input.shippingMethod)) return "Vyberte platný spôsob dopravy.";
  return null;
}

export function isValidOrderDetails(input: Omit<CreateOrderInput, "userId" | "paymentMethod">) {
  return validateOrderDetails(input) === null;
}

export function isValidCreateOrderInput(input: CreateOrderInput) {
  return isValidOrderDetails(input) && isPaymentMethodCode(input.paymentMethod);
}
