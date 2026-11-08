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
} from "../../../../../drizzle/schema";
import type { ProductListItem, ProductSearchCriteria } from "../../domain/product";
import { parseAudience } from "./helpers";

export async function searchCatalogQuery(criteria: ProductSearchCriteria): Promise<ProductListItem[]> {
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
    ...(criteria.audience
      ? [
          criteria.audience === "unisex"
            ? eq(products.audience, "unisex")
            : or(eq(products.audience, criteria.audience), eq(products.audience, "unisex")),
        ]
      : []),
  ];

  const rows = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      description: products.description,
      brand: products.brand,
      category: categories.name,
      categorySlug: categories.slug,
      audience: products.audience,
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
    .groupBy(products.id, categories.name, categories.slug, products.audience)
    .orderBy(asc(products.name))
    .limit(criteria.limit ?? 24);

  return rows.map((row) => ({
    ...row,
    audience: parseAudience(row.audience),
  }));
}