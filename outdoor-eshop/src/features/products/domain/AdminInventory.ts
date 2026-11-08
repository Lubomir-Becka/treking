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

function validPrice(value: unknown) {
  return typeof value === "string" && /^\d{1,8}(?:\.\d{1,2})?$/.test(value);
}

export function validateBatchVariantInput(value: unknown): string | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return "Očakávajú sa údaje variantov.";
  const data = value as Record<string, unknown>;
  if (!Array.isArray(data.sizes) || data.sizes.length === 0) return "Vyberte aspoň jednu veľkosť.";
  const letters = data.sizes.every((size: unknown) => typeof size === "string" && (letterSizes as readonly string[]).includes(size));
  const numbers = data.sizes.every((size: unknown) => typeof size === "string" && numericSizes.includes(size));
  if ((!letters && !numbers) || new Set(data.sizes).size !== data.sizes.length) {
    return "Vyberte rôzne povolené veľkosti iba jedného typu.";
  }
  if (!validPrice(data.price)) return "Cena musí byť nezáporná, mať najviac 8 číslic pred bodkou a 2 za bodkou.";
  return null;
}

export function parseBatchVariantInput(value: unknown): BatchVariantInput | null {
  if (validateBatchVariantInput(value)) return null;
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const data = value as Record<string, unknown>;
  if (!Array.isArray(data.sizes) || typeof data.price !== "string") return null;
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

export function validateColorInput(value: unknown): string | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return "Očakávajú sa údaje farby.";
  const data = value as Record<string, unknown>;
  if (typeof data.name !== "string" || !data.name.trim() || data.name.length > 30 ||
    /[\u0000-\u001f\u007f-\u009f]/u.test(data.name)) {
    return "Názov farby je povinný, môže mať najviac 30 znakov a nesmie obsahovať riadiace znaky.";
  }
  if (typeof data.hexCode !== "string" || !/^#[0-9a-f]{6}$/i.test(data.hexCode)) {
    return "HEX farby musí mať tvar #RRGGBB.";
  }
  return null;
}

export function parseColorInput(value: unknown): ColorInput | null {
  if (validateColorInput(value)) return null;
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const data = value as Record<string, unknown>;
  if (typeof data.name !== "string" || typeof data.hexCode !== "string") return null;
  const name = data.name.trim();
  return { name, hexCode: data.hexCode.toLowerCase() };
}

export function validateVariantInput(value: unknown): string | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return "Očakávajú sa údaje variantu.";
  const data = value as Record<string, unknown>;
  if (typeof data.sku !== "string" || !data.sku.trim() || data.sku.length > 100 ||
    /[\u0000-\u001f\u007f-\u009f]/u.test(data.sku)) {
    return "SKU je povinné, môže mať najviac 100 znakov a nesmie obsahovať riadiace znaky.";
  }
  if (typeof data.size !== "string" || !data.size.trim() || data.size.length > 20 ||
    /[\u0000-\u001f\u007f-\u009f]/u.test(data.size)) {
    return "Veľkosť je povinná, môže mať najviac 20 znakov a nesmie obsahovať riadiace znaky.";
  }
  if (!validPrice(data.price)) return "Cena musí byť nezáporná, mať najviac 8 číslic pred bodkou a 2 za bodkou.";
  if (typeof data.stock !== "number" || !Number.isInteger(data.stock) || data.stock < 0 || data.stock > 2_147_483_647) {
    return "Sklad musí byť celé číslo od 0 do 2147483647.";
  }
  if (typeof data.isActive !== "boolean") return "Stav variantu musí byť aktívny alebo neaktívny.";
  return null;
}

export function parseVariantInput(value: unknown): VariantInput | null {
  if (validateVariantInput(value)) return null;
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const data = value as Record<string, unknown>;
  if (typeof data.sku !== "string" || typeof data.size !== "string" ||
      typeof data.price !== "string" || typeof data.stock !== "number" ||
      typeof data.isActive !== "boolean") return null;
  const sku = data.sku.trim();
  const size = data.size.trim();
  return { sku, size, price: data.price, stock: data.stock, isActive: data.isActive };
}

export function parseInventoryId(value: unknown): number | null {
  return typeof value === "number" && isCategoryId(value) ? value : null;
}
