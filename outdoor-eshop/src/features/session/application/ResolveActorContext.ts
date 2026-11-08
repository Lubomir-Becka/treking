import type { ActorContext } from "../domain/ActorContext";
import {
  CUSTOMER_SESSION_COOKIE,
  GUEST_SESSION_COOKIE,
  type SessionCookiePort,
} from "../domain/SessionCookiePort";
import type { SessionRepository } from "../domain/SessionRepository";
import type { TokenServicePort } from "../domain/TokenServicePort";
import type { UserAccountRepository } from "../domain/UserAccountRepository";

const SESSION_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000;
const SLIDING_WINDOW_MS = 15 * 24 * 60 * 60 * 1000;

export function createResolveActorContext(
  cookies: SessionCookiePort,
  repository: SessionRepository,
  tokens: TokenServicePort,
  accounts: Pick<UserAccountRepository, "findById">,
) {
  return async function resolveActorContext(): Promise<ActorContext> {
    const customerToken = await cookies.get(CUSTOMER_SESSION_COOKIE);

    if (customerToken) {
      const tokenHash = tokens.hashToken(customerToken);
      const session = await repository.findUserSession(tokenHash);

      if (session) {
        const now = Date.now();
        const expiresAt = session.expiresAt.getTime();

        if (expiresAt > now) {
          const user = await accounts.findById(session.userId);
          if (!user || !user.isActive) {
            await repository.deleteUserSession(tokenHash);
            return { type: "anonymous" };
          }
          if (expiresAt - now <= SLIDING_WINDOW_MS) {
            const extendedExpiry = new Date(now + SESSION_LIFETIME_MS);
            await repository.extendUserSession(session.id, extendedExpiry);
            session.expiresAt = extendedExpiry;
          }

          return {
            type: "authenticated",
            userId: session.userId,
            sessionId: session.id,
            expiresAt: session.expiresAt,
            role: user.role,
          };
        }

        await repository.deleteUserSession(tokenHash);
      }
    }

    const guestToken = await cookies.get(GUEST_SESSION_COOKIE);

    if (guestToken) {
      const tokenHash = tokens.hashToken(guestToken);
      const session = await repository.findGuestSession(tokenHash);

      if (session && session.expiresAt.getTime() > Date.now()) {
        return { type: "guest", tokenHash, expiresAt: session.expiresAt };
      }

      await repository.deleteGuestSession(tokenHash);
    }

    return { type: "anonymous" };
  };
}
