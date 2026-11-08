import { and, asc, eq } from "drizzle-orm";
import { db } from "@/shared/db/client";
import {
  attributes,
  categories,
  productAttributes,
  productColors,
  productImages,
  products,
  productVariants,
} from "../../../../../drizzle/schema";
import type { ProductDetail } from "../../domain/product";
import { parseAudience } from "./helpers";

export async function findProductDetailQuery(slug: string): Promise<ProductDetail | null> {
  const [product] = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      description: products.description,
      brand: products.brand,
      category: categories.name,
      categorySlug: categories.slug,
      audience: products.audience,
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(and(eq(products.slug, slug), eq(products.isActive, true)))
    .limit(1);

  if (!product) {
    return null;
  }

  const [colors, productAttributesResult] = await Promise.all([
    db
      .select({
        id: productColors.id,
        name: productColors.colorName,
        hexCode: productColors.hexCode,
        imageUrl: productImages.imageUrl,
        imageAlt: productImages.altText,
        imageOrder: productImages.displayOrder,
        variantId: productVariants.id,
        sku: productVariants.sku,
        size: productVariants.size,
        price: productVariants.price,
        stock: productVariants.stock,
        variantActive: productVariants.isActive,
      })
      .from(productColors)
      .innerJoin(productImages, eq(productImages.productColorId, productColors.id))
      .leftJoin(
        productVariants,
        eq(productVariants.productColorId, productColors.id),
      )
      .where(eq(productColors.productId, product.id))
      .orderBy(
        asc(productColors.id),
        asc(productImages.displayOrder),
        asc(productVariants.size),
      ),
    db
      .select({
        label: attributes.name,
        unit: attributes.unit,
        value: productAttributes.value,
      })
      .from(productAttributes)
      .innerJoin(attributes, eq(productAttributes.attributeId, attributes.id))
      .where(eq(productAttributes.productId, product.id))
      .orderBy(asc(attributes.name)),
  ]);

  const colorMap = new Map<number, ProductDetail["colors"][number]>();

  for (const row of colors) {
    const color = colorMap.get(row.id) ?? {
      id: row.id,
      name: row.name ?? "Nešpecifikovaná farba",
      hexCode: row.hexCode ?? "#ffffff",
      images: [],
      variants: [],
    };

    if (row.imageUrl && !color.images.some((image) => image.url === row.imageUrl)) {
      color.images.push({
        url: row.imageUrl,
        alt: row.imageAlt ?? product.name,
        order: row.imageOrder ?? 0,
      });
    }

    if (
      row.variantId !== null &&
      row.variantActive &&
      !color.variants.some((variant) => variant.id === row.variantId)
    ) {
      color.variants.push({
        id: row.variantId,
        sku: row.sku ?? product.slug,
        size: row.size,
        price: Number(row.price),
        stock: row.stock ?? 0,
      });
    }

    colorMap.set(row.id, color);
  }

  const variants = Array.from(colorMap.values()).flatMap(
    (color) => color.variants,
  );

  return {
    ...product,
    audience: parseAudience(product.audience),
    attributes: productAttributesResult,
    colors: Array.from(colorMap.values()),
    price: variants.length
      ? Math.min(...variants.map((variant) => variant.price))
      : null,
  };
}