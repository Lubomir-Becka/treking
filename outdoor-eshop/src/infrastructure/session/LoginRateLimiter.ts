import type { RateLimiterPort } from "../../domain/session/RateLimiterPort";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;
const MAX_TRACKED_KEYS = 10_000;

const attempts = new Map<string, { count: number; resetAt: number }>();

export class LoginRateLimiter implements RateLimiterPort {
  assertAllowed(key: string) {
    const now = Date.now();
    for (const [storedKey, entry] of attempts) {
      if (entry.resetAt <= now) attempts.delete(storedKey);
    }

    const current = attempts.get(key);

    if (!current) {
      if (attempts.size >= MAX_TRACKED_KEYS) {
        const oldestKey = attempts.keys().next().value;
        if (oldestKey !== undefined) attempts.delete(oldestKey);
      }
      attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
      return;
    }

    if (current.count >= MAX_ATTEMPTS) {
      throw new Error("RATE_LIMITED");
    }

    current.count += 1;
  }
}
