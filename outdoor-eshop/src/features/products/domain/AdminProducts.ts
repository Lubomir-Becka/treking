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

export function validateAdminProduct(value: unknown): string | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return "Očakávajú sa údaje produktu.";
  const data = value as Record<string, unknown>;
  if (typeof data.name !== "string" || !data.name.trim() || data.name.length > 150 ||
    /[\u0000-\u001f\u007f-\u009f]/u.test(data.name)) {
    return "Názov produktu je povinný, môže mať najviac 150 znakov a nesmie obsahovať riadiace znaky.";
  }
  if (typeof data.brand !== "string" || !data.brand.trim() || data.brand.length > 100 ||
    /[\u0000-\u001f\u007f-\u009f]/u.test(data.brand)) {
    return "Značka je povinná, môže mať najviac 100 znakov a nesmie obsahovať riadiace znaky.";
  }
  if (typeof data.slug !== "string" || data.slug.length > 180 ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.slug)) {
    return "Slug môže mať najviac 180 znakov a obsahovať malé písmená, čísla a pomlčky medzi slovami.";
  }
  if (typeof data.description !== "string" || data.description.length > 5000 ||
    /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f]/u.test(data.description)) {
    return "Opis môže mať najviac 5000 znakov a nesmie obsahovať nepovolené riadiace znaky.";
  }
  if (data.categoryId !== null && (typeof data.categoryId !== "number" || !isCategoryId(data.categoryId))) {
    return "Vyberte platnú kategóriu.";
  }
  if (!isTargetAudience(data.audience)) return "Vyberte platné určenie produktu.";
  return null;
}

export function parseAdminProduct(value: unknown): AdminProductInput | null {
  if (validateAdminProduct(value)) return null;
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
  return {
    name,
    brand,
    slug: data.slug,
    description: description || null,
    categoryId: data.categoryId,
    audience: data.audience,
  };
}
