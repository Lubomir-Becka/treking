import {
  CUSTOMER_SESSION_COOKIE,
  type SessionCookiePort,
} from "../domain/SessionCookiePort";
import type { SessionRepository } from "../domain/SessionRepository";
import type { TokenServicePort } from "../domain/TokenServicePort";

export function createRevokeSession(
  cookies: SessionCookiePort,
  repository: SessionRepository,
  tokens: TokenServicePort,
) {
  return async function revokeSession() {
    const token = await cookies.get(CUSTOMER_SESSION_COOKIE);

    if (token) {
      await repository.deleteUserSession(tokens.hashToken(token));
      await cookies.clear(CUSTOMER_SESSION_COOKIE);
    }
  };
}
