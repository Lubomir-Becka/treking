import type { PasswordServicePort } from "../domain/PasswordServicePort";
import type { UserAccountRepository } from "../domain/UserAccountRepository";
import { isValidRegistration } from "../../../shared/domain/contactValidation";
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
    if (!isValidRegistration(input)) {
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
      role: "customer",
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    });
    return { id: user.id, email: user.email, role: "customer" as const };
  };
}
