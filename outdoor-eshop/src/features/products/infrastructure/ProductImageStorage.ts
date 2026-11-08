import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const imageDirectory = path.resolve(/*turbopackIgnore: true*/ process.env.PRODUCT_IMAGE_DIRECTORY ?? "./uploads/products");
const imageNamePattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.webp$/;
const publicPrefix = "/api/product-images/";

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export class InvalidProductImage extends Error {}

export async function saveProductImage(file: File): Promise<string> {
  if (file.size === 0 || file.size > MAX_IMAGE_BYTES ||
    !["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    throw new InvalidProductImage("Povolené sú obrázky JPEG, PNG a WebP do 5 MB.");
  }
  const input = Buffer.from(await file.arrayBuffer());
  let output: Buffer;
  try {
    const image = sharp(input, { limitInputPixels: 40_000_000, failOn: "error", pages: 1 });
    const metadata = await image.metadata();
    if (!metadata.format || !["jpeg", "png", "webp"].includes(metadata.format) ||
      `image/${metadata.format === "jpeg" ? "jpeg" : metadata.format}` !== file.type ||
      (metadata.pages ?? 1) > 1) {
      throw new InvalidProductImage("Obsah súboru nezodpovedá povolenému formátu.");
    }
    output = await image.rotate().webp().toBuffer();
  } catch (error) {
    if (error instanceof InvalidProductImage) throw error;
    throw new InvalidProductImage("Súbor nie je platný obrázok.");
  }
  await mkdir(imageDirectory, { recursive: true });
  const name = `${randomUUID()}.webp`;
  await writeFile(path.join(imageDirectory, name), output, { flag: "wx" });
  return `${publicPrefix}${name}`;
}

export async function readProductImage(name: string): Promise<Buffer | null> {
  if (!imageNamePattern.test(name)) return null;
  try {
    return await readFile(/*turbopackIgnore: true*/ path.join(imageDirectory, name));
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") return null;
    throw error;
  }
}

export async function removeStoredProductImage(url: string | null): Promise<void> {
  if (!url?.startsWith(publicPrefix)) return;
  const name = url.slice(publicPrefix.length);
  if (!imageNamePattern.test(name)) return;
  try {
    await unlink(/*turbopackIgnore: true*/ path.join(imageDirectory, name));
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") return;
    throw error;
  }
}
