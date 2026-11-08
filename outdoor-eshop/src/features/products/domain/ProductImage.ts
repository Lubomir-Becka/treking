export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const PRODUCT_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function isValidProductImage(file: Pick<File, "size" | "type">) {
  return file.size > 0 && file.size <= MAX_IMAGE_BYTES && PRODUCT_IMAGE_TYPES.includes(file.type);
}
