import {
  GUEST_SESSION_COOKIE,
  type SessionCookiePort,
} from "../../domain/session/SessionCookiePort";
import type { SessionRepository } from "../../domain/session/SessionRepository";
import type { TokenServicePort } from "../../domain/session/TokenServicePort";

const GUEST_LIFETIME_MS = 14 * 24 * 60 * 60 * 1000;

export function createEnsureGuestSession(
  cookies: SessionCookiePort,
  repository: SessionRepository,
  tokens: TokenServicePort,
) {
  return async function ensureGuestSession() {
    const existingToken = await cookies.get(GUEST_SESSION_COOKIE);

    if (existingToken) {
      const tokenHash = tokens.hashToken(existingToken);
      const session = await repository.findGuestSession(tokenHash);

      if (session && session.expiresAt.getTime() > Date.now()) {
        return { type: "guest" as const, tokenHash, expiresAt: session.expiresAt };
      }

      await repository.deleteGuestSession(tokenHash);
    }

    const token = tokens.generateToken();
    const tokenHash = tokens.hashToken(token);
    const expiresAt = new Date(Date.now() + GUEST_LIFETIME_MS);
    await repository.createGuestSession(tokenHash, expiresAt);
    await cookies.set(GUEST_SESSION_COOKIE, token, expiresAt);

    return { type: "guest" as const, tokenHash, expiresAt };
  };
}
