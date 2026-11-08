import { isCategoryId } from "./CategoryManagement";
import { isTargetAudience, type TargetAudience } from "./product";

export type AdminProduct = {
  id: number;
  name: string;
  slug: string;
  brand: string;
  description: string | null;
  categoryId: number | null;
  audience: TargetAudience;
  isActive: boolean;
  variantCount: number;
  activeVariantCount: number;
  skus: string[];
};

export type AdminProductInput = Omit<AdminProduct, "id" | "isActive" | "variantCount" | "activeVariantCount" | "skus">;

export function parseAdminProduct(value: unknown): AdminProductInput | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const data = value as Record<string, unknown>;
  if (
    typeof data.name !== "string" ||
    typeof data.brand !== "string" ||
    typeof data.slug !== "string" ||
    typeof data.description !== "string" ||
    (data.categoryId !== null && (typeof data.categoryId !== "number" || !isCategoryId(data.categoryId))) ||
    !isTargetAudience(data.audience)
  ) return null;
  const name = data.name.trim();
  const brand = data.brand.trim();
  const description = data.description.trim();
  if (!name || name.length > 150 || !brand || brand.length > 100 ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.slug) || data.slug.length > 180 ||
    description.length > 5000 ||
    /[\u0000-\u001f\u007f-\u009f]/u.test(name + brand) ||
    /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f]/u.test(description)) return null;
  return {
    name,
    brand,
    slug: data.slug,
    description: description || null,
    categoryId: data.categoryId,
    audience: data.audience,
  };
}
