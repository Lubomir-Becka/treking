export interface RateLimiterPort {
  assertAllowed(key: string): void;
}
