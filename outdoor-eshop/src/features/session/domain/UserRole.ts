export type UserRole = "customer" | "admin";

export function isUserRole(value: unknown): value is UserRole {
  return value === "customer" || value === "admin";
}
