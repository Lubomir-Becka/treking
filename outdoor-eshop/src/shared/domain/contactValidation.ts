import { isValidCustomerEmail } from "./email";

export function isValidPersonName(value: string) {
  const name = value.trim();
  return name.length > 0 && value.length <= 50 &&
    !/[\u0000-\u001f\u007f-\u009f]/u.test(value);
}

export function isValidPhone(value: string) {
  const phone = value.trim();
  return value.length <= 20 && /^\+?[0-9 ()-]+$/.test(phone) &&
    !/[\u0000-\u001f\u007f-\u009f]/u.test(value) &&
    phone.replace(/\D/g, "").length >= 7;
}

export function validateOptionalPhone(value: string): string | null {
  if (value.length > 20 || /[\u0000-\u001f\u007f-\u009f]/u.test(value) ||
    (value.trim() !== "" && !isValidPhone(value))) {
    return "Telefón musí obsahovať aspoň 7 číslic a najviac 20 znakov; povolené sú číslice, medzery, zátvorky, pomlčka a úvodné +.";
  }
  return null;
}

export function isValidPassword(value: string) {
  return value.length >= 8 && new TextEncoder().encode(value).length <= 72;
}

export type RegistrationInput = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
};

export function validateProfileNames(input: { firstName: string; lastName: string }): string | null {
  if (!isValidPersonName(input.firstName)) {
    return "Meno je povinné, môže mať najviac 50 znakov a nesmie obsahovať riadiace znaky.";
  }
  if (!isValidPersonName(input.lastName)) {
    return "Priezvisko je povinné, môže mať najviac 50 znakov a nesmie obsahovať riadiace znaky.";
  }
  return null;
}

export function validateRegistration(input: RegistrationInput): string | null {
  const nameError = validateProfileNames(input);
  if (nameError) return nameError;
  if (!isValidCustomerEmail(input.email)) return "Zadajte platnú e-mailovú adresu (najviac 100 znakov).";
  if (!isValidPassword(input.password)) return "Heslo musí mať aspoň 8 znakov a najviac 72 bajtov v UTF-8.";
  return input.phone === undefined ? null : validateOptionalPhone(input.phone);
}

export function isValidRegistration(input: RegistrationInput) {
  return validateRegistration(input) === null;
}
