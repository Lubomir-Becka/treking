import type { PasswordServicePort } from "../domain/PasswordServicePort";
import type { UserAccountRepository } from "../domain/UserAccountRepository";
import { isValidCustomerEmail } from "../../../shared/domain/email";
import { createCustomerSession } from "./CreateCustomerSession";

export type RegisterCustomerInput = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  ipAddress?: string;
  userAgent?: string;
};

export function createRegisterCustomer(
  accounts: UserAccountRepository,
  passwords: PasswordServicePort,
  createSession: ReturnType<typeof createCustomerSession>,
) {
  return async function register(input: RegisterCustomerInput) {
    const email = input.email.trim().toLowerCase();
    if (
      !isValidCustomerEmail(email) ||
      input.password.length < 8 ||
      new TextEncoder().encode(input.password).length > 72 ||
      !input.firstName.trim() ||
      input.firstName.trim().length > 50 ||
      !input.lastName.trim() ||
      input.lastName.trim().length > 50 ||
      (input.phone !== undefined && input.phone.trim().length > 20)
    ) {
      throw new Error("INVALID_REGISTRATION");
    }
    if (await accounts.findByEmail(email)) {
      throw new Error("EMAIL_ALREADY_REGISTERED");
    }

    const user = await accounts.create({
      email,
      passwordHash: await passwords.hash(input.password),
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      phone: input.phone?.trim() || undefined,
    });

    await createSession({
      userId: user.id,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    });
    return { id: user.id, email: user.email };
  };
}
