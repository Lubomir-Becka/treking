export const CUSTOMER_SESSION_COOKIE = "vt_customer_session";
export const GUEST_SESSION_COOKIE = "vt_guest_session";

export interface SessionCookiePort {
  get(name: string): Promise<string | undefined>;
  set(name: string, value: string, expiresAt: Date): Promise<void>;
  clear(name: string): Promise<void>;
}
