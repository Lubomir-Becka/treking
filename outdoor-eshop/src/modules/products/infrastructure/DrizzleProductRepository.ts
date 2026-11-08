import { and, asc, eq, ilike, max, min, or, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import {
  attributes,
  categories,
  productAttributes,
  productColors,
  productImages,
  products,
  productVariants,
} from "../../../../drizzle/schema";
import type { ProductRepository } from "../domain/ProductRepository";
import type {
  ProductDetail,
  ProductListItem,
  ProductSearchCriteria,
} from "../domain/product";

export class DrizzleProductRepository implements ProductRepository {
  async findBySlug(slug: string): Promise<ProductDetail | null> {
    const [product] = await db
      .select({
        id: products.id,
        name: products.name,
        slug: products.slug,
        description: products.description,
        brand: products.brand,
        category: categories.name,
        categorySlug: categories.slug,
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
        .leftJoin(productImages, eq(productImages.productColorId, productColors.id))
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

      if (row.variantId && row.variantActive) {
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
      attributes: productAttributesResult,
      colors: Array.from(colorMap.values()),
      price: variants.length
        ? Math.min(...variants.map((variant) => variant.price))
        : null,
    };
  }

  async search(criteria: ProductSearchCriteria): Promise<ProductListItem[]> {
    const searchTerm = criteria.query?.trim();
    const filters = [
      eq(products.isActive, true),
      ...(searchTerm
        ? [
            or(
              ilike(products.name, `%${searchTerm}%`),
              ilike(products.description, `%${searchTerm}%`),
              ilike(categories.name, `%${searchTerm}%`),
              ilike(productColors.colorName, `%${searchTerm}%`),
              ilike(attributes.name, `%${searchTerm}%`),
              ilike(productAttributes.value, `%${searchTerm}%`),
            ),
          ]
        : []),
      ...(criteria.categorySlug
        ? [eq(categories.slug, criteria.categorySlug)]
        : []),
    ];

    return db
      .select({
        id: products.id,
        name: products.name,
        slug: products.slug,
        description: products.description,
        brand: products.brand,
        category: categories.name,
        categorySlug: categories.slug,
        price: min(productVariants.price),
        imageUrl: min(productImages.imageUrl),
        stock: max(productVariants.stock),
        filterText: sql<string>`string_agg(
          distinct concat_ws(
            ' ',
            ${productColors.colorName},
            ${productVariants.size},
            ${attributes.name},
            ${attributes.unit},
            ${productAttributes.value}
          ),
          ' '
        )`,
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .leftJoin(productColors, eq(productColors.productId, products.id))
      .leftJoin(
        productVariants,
        and(
          eq(productVariants.productColorId, productColors.id),
          eq(productVariants.isActive, true),
        ),
      )
      .leftJoin(
        productImages,
        and(
          eq(productImages.productColorId, productColors.id),
          eq(productImages.isPrimary, true),
        ),
      )
      .leftJoin(
        productAttributes,
        eq(productAttributes.productId, products.id),
      )
      .leftJoin(
        attributes,
        eq(productAttributes.attributeId, attributes.id),
      )
      .where(and(...filters))
      .groupBy(products.id, categories.name, categories.slug)
      .orderBy(asc(products.name))
      .limit(criteria.limit ?? 24);
  }

  async findCategory(slug: string) {
    const [category] = await db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        parentId: categories.parentId,
        productCount: sql<number>`count(distinct ${products.id})`,
      })
      .from(categories)
      .leftJoin(products, and(eq(products.categoryId, categories.id), eq(products.isActive, true)))
      .where(eq(categories.slug, slug))
      .groupBy(categories.id)
      .limit(1);

    return category ? { ...category, productCount: Number(category.productCount) } : null;
  }

  async findSubcategories(parentId: number) {
    const rows = await db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        parentId: categories.parentId,
        productCount: sql<number>`count(distinct ${products.id})`,
      })
      .from(categories)
      .leftJoin(products, and(eq(products.categoryId, categories.id), eq(products.isActive, true)))
      .where(eq(categories.parentId, parentId))
      .groupBy(categories.id)
      .orderBy(asc(categories.name));

    return rows.map((row) => ({ ...row, productCount: Number(row.productCount) }));
  }
}
