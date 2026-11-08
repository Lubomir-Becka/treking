import {
  CUSTOMER_SESSION_COOKIE,
  GUEST_SESSION_COOKIE,
  type SessionCookiePort,
} from "../../domain/session/SessionCookiePort";
import type { SessionRepository } from "../../domain/session/SessionRepository";
import type { TokenServicePort } from "../../domain/session/TokenServicePort";
import type { GuestCartMergePort } from "../../domain/session/GuestCartMergePort";

const CUSTOMER_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000;

export type CreateCustomerSessionInput = {
  userId: number;
  ipAddress?: string;
  userAgent?: string;
};

export function createCustomerSession(
  cookies: SessionCookiePort,
  repository: SessionRepository,
  tokens: TokenServicePort,
  guestCartMerger: GuestCartMergePort,
) {
  return async function execute(input: CreateCustomerSessionInput) {
    const previousCustomerToken = await cookies.get(CUSTOMER_SESSION_COOKIE);

    if (previousCustomerToken) {
      await repository.deleteUserSession(tokens.hashToken(previousCustomerToken));
    }

    const guestToken = await cookies.get(GUEST_SESSION_COOKIE);
    const token = tokens.generateToken();
    const tokenHash = tokens.hashToken(token);
    const expiresAt = new Date(Date.now() + CUSTOMER_LIFETIME_MS);

    const session = await repository.createUserSession({
      ...input,
      tokenHash,
      expiresAt,
    });

    if (guestToken) {
      const guestTokenHash = tokens.hashToken(guestToken);
      await guestCartMerger.mergeGuestCart(
        guestTokenHash,
        input.userId,
      );
      await repository.deleteGuestSession(guestTokenHash);
      await cookies.clear(GUEST_SESSION_COOKIE);
    }

    await cookies.set(CUSTOMER_SESSION_COOKIE, token, expiresAt);
    return session;
  };
}
