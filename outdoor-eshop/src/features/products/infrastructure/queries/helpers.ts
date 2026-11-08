import type { TargetAudience } from "../../domain/product";

export function parseAudience(value: string): TargetAudience {
  if (value === "men" || value === "women" || value === "unisex") {
    return value;
  }
  return "unisex";
}