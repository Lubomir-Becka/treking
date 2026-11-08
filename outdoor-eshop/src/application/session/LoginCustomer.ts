import type { PasswordServicePort } from "../../domain/session/PasswordServicePort";
import type { RateLimiterPort } from "../../domain/session/RateLimiterPort";
import type { UserAccountRepository } from "../../domain/session/UserAccountRepository";
import { createCustomerSession } from "./CreateCustomerSession";

export function createLoginCustomer(
  accounts: UserAccountRepository,
  passwords: PasswordServicePort,
  rateLimiter: RateLimiterPort,
  createSession: ReturnType<typeof createCustomerSession>,
) {
  return async function login(input: {
    email: string;
    password: string;
    ipAddress?: string;
    userAgent?: string;
  }) {
    rateLimiter.assertAllowed(input.email.trim().toLowerCase());
    const user = await accounts.findByEmail(input.email.trim().toLowerCase());
    const valid = user
      ? await passwords.verify(input.password, user.passwordHash)
      : false;

    if (!user || !valid || !user.isActive) {
      throw new Error("INVALID_CREDENTIALS");
    }

    await createSession({
      userId: user.id,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    });
    return { id: user.id, email: user.email };
  };
}
