import { isCategoryId } from "./CategoryManagement";

export type AdminVariant = {
  id: number;
  sku: string;
  size: string | null;
  price: string;
  stock: number;
  isActive: boolean;
};

export type AdminColor = {
  id: number;
  name: string | null;
  hexCode: string | null;
  imageUrl: string | null;
  images: AdminImage[];
  variants: AdminVariant[];
};

export type AdminImage = {
  id: number;
  url: string;
  isPrimary: boolean;
};

export const letterSizes = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "3XL"] as const;
export const numericSizes = Array.from({ length: 16 }, (_, index) => String(index + 35));

export type BatchVariantInput = {
  sizes: string[];
  price: string;
};

export function parseBatchVariantInput(value: unknown): BatchVariantInput | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const data = value as Record<string, unknown>;
  if (!Array.isArray(data.sizes) || data.sizes.length === 0 ||
      typeof data.price !== "string" || !/^\d{1,8}(?:\.\d{1,2})?$/.test(data.price)) return null;
  const allowed = data.sizes.every((size: unknown) =>
    typeof size === "string" && ([...letterSizes] as string[]).includes(size));
  const numeric = data.sizes.every((size: unknown) =>
    typeof size === "string" && numericSizes.includes(size));
  if ((!allowed && !numeric) || new Set(data.sizes).size !== data.sizes.length) return null;
  return { sizes: data.sizes, price: data.price };
}

export type ColorInput = {
  name: string;
  hexCode: string;
};

export type VariantInput = {
  sku: string;
  size: string;
  price: string;
  stock: number;
  isActive: boolean;
};

export function parseColorInput(value: unknown): ColorInput | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const data = value as Record<string, unknown>;
  if (typeof data.name !== "string" || typeof data.hexCode !== "string") return null;
  const name = data.name.trim();
  if (!name || name.length > 30 || /[\u0000-\u001f\u007f-\u009f]/u.test(name) ||
      !/^#[0-9a-f]{6}$/i.test(data.hexCode)) return null;
  return { name, hexCode: data.hexCode.toLowerCase() };
}

export function parseVariantInput(value: unknown): VariantInput | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const data = value as Record<string, unknown>;
  if (typeof data.sku !== "string" || typeof data.size !== "string" ||
      typeof data.price !== "string" || typeof data.stock !== "number" ||
      typeof data.isActive !== "boolean") return null;
  const sku = data.sku.trim();
  const size = data.size.trim();
  if (!sku || sku.length > 100 || !size || size.length > 20 ||
      /[\u0000-\u001f\u007f-\u009f]/u.test(sku + size) ||
      !/^\d{1,8}(?:\.\d{1,2})?$/.test(data.price) ||
      !Number.isInteger(data.stock) || data.stock < 0 || data.stock > 2_147_483_647) return null;
  return { sku, size, price: data.price, stock: data.stock, isActive: data.isActive };
}

export function parseInventoryId(value: unknown): number | null {
  return typeof value === "number" && isCategoryId(value) ? value : null;
}
