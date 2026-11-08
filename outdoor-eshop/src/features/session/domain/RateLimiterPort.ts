export interface RateLimiterPort {
  assertAllowed(email: string, ipAddress?: string): Promise<void>;
}
