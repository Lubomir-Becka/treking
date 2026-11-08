import type { PasswordServicePort } from "../domain/PasswordServicePort";
import type { RateLimiterPort } from "../domain/RateLimiterPort";
import type { UserAccountRepository } from "../domain/UserAccountRepository";
import type { UserRole } from "../domain/UserRole";
import { createCustomerSession } from "./CreateCustomerSession";
import { isValidCustomerEmail } from "../../../shared/domain/email";
import { isValidPassword } from "../../../shared/domain/contactValidation";

export function createLoginCustomer(
  accounts: UserAccountRepository,
  passwords: PasswordServicePort,
  rateLimiter: RateLimiterPort,
  createSession: ReturnType<typeof createCustomerSession>,
  requiredRole: UserRole,
) {
  return async function login(input: {
    email: string;
    password: string;
    ipAddress?: string;
    userAgent?: string;
  }) {
    await rateLimiter.assertAllowed(input.email.trim().toLowerCase(), input.ipAddress);
    if (!isValidCustomerEmail(input.email) || !isValidPassword(input.password)) {
      throw new Error("INVALID_CREDENTIALS");
    }
    const user = await accounts.findByEmail(input.email.trim().toLowerCase());
    const valid = user
      ? await passwords.verify(input.password, user.passwordHash)
      : false;

    if (!user || !valid || !user.isActive || user.role !== requiredRole) {
      throw new Error("INVALID_CREDENTIALS");
    }

    await createSession({
      userId: user.id,
      role: user.role,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    });
    return { id: user.id, email: user.email, role: user.role };
  };
}
