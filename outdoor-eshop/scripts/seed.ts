import "dotenv/config";
import { existsSync } from "node:fs";
import { resolve, sep } from "node:path";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "../src/shared/db/client";
import {
  categories,
  productColors,
  productImages,
  products,
  orderItems,
  productVariants,
} from "../drizzle/schema";
import { sql } from "drizzle-orm";

type ProductImage = {
  url: string;
  alt: string;
  isPrimary: boolean;
  order: number;
};

type CatalogProduct = {
  category: {
    name: string;
    slug: string;
  };
  name: string;
  slug: string;
  audience?: "men" | "women" | "unisex";
  description: string;
  price: string;
  skuPrefix: string;
  color: {
    name: string;
    hexCode: string;
  };
  images: ProductImage[];
};

type ColorwayCatalogProduct = Omit<CatalogProduct, "color" | "images"> & {
  sizes?: string[];
  colorways: Array<{
    color: CatalogProduct["color"];
    skuSuffix: string;
    images: ProductImage[];
  }>;
};

function assertProductImages(productSlug: string, images: ProductImage[]) {
  if (images.length === 0) {
    throw new Error(`Product "${productSlug}" must have at least one image.`);
  }

  const publicDirectory = resolve(process.cwd(), "public");
  for (const image of images) {
    const imagePath = resolve(publicDirectory, image.url.replace(/^\/+/, ""));

    if (
      !image.url.startsWith("/img/products/") ||
      !image.url.endsWith(".webp") ||
      !imagePath.startsWith(`${publicDirectory}${sep}`) ||
      !existsSync(imagePath)
    ) {
      throw new Error(`Product "${productSlug}" references a missing or invalid image: ${image.url}`);
    }
  }
}

async function seedProductImage(input: {
  productColorId: number;
  imageUrl: string;
  altText: string;
  isPrimary: boolean;
  displayOrder: number;
}) {
  const imageUrl = input.imageUrl.trim();
  const existingImages = await db
    .select({ id: productImages.id })
    .from(productImages)
    .where(and(
      eq(productImages.productColorId, input.productColorId),
      eq(productImages.imageUrl, imageUrl),
    ));
  const [existingImage, ...duplicates] = existingImages;

  if (duplicates.length > 0) {
    await db.delete(productImages).where(
      inArray(productImages.id, duplicates.map((image) => image.id)),
    );
  }

  if (input.isPrimary) {
    await db
      .update(productImages)
      .set({ isPrimary: false })
      .where(eq(productImages.productColorId, input.productColorId));
  }

  if (existingImage) {
    await db
      .update(productImages)
      .set({
        altText: input.altText,
        isPrimary: input.isPrimary,
        displayOrder: input.displayOrder,
      })
      .where(eq(productImages.id, existingImage.id));
  } else {
    await db.insert(productImages).values({ ...input, imageUrl });
  }

  if (imageUrl.endsWith(".webp")) {
    const filename = imageUrl.slice(imageUrl.lastIndexOf("/") + 1);
    const staleImageUrls = [
      imageUrl.replace(/\.webp$/, ".png"),
      `/img/products/${filename.replace(/\.webp$/, ".png")}`,
      `/img/products/${filename}`,
    ].filter((url) => url !== imageUrl);

    await db
      .delete(productImages)
      .where(and(
        eq(productImages.productColorId, input.productColorId),
        inArray(productImages.imageUrl, staleImageUrls),
      ));
  }
}

async function findOrCreateCategory(category: CatalogProduct["category"]) {
  await db
    .insert(categories)
    .values(category)
    .onConflictDoNothing({ target: categories.slug });

  const [storedCategory] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.slug, category.slug))
    .limit(1);

  if (!storedCategory) {
    throw new Error(`Unable to create or find category "${category.slug}".`);
  }

  return storedCategory.id;
}

async function ensureCategoryHierarchy() {
  const hierarchy = [
    {
      name: "Bundy",
      slug: "bundy",
      children: [{ name: "Hardshell bundy", slug: "hardshell-bundy" }],
    },
    {
      name: "Nohavice",
      slug: "nohavice",
      children: [{ name: "Technické nohavice", slug: "technicke-nohavice" }],
    },
    {
      name: "Obuv",
      slug: "obuv",
      children: [{ name: "Turistická obuv", slug: "turisticka-obuv" }],
    },
    {
      name: "Doplnky",
      slug: "doplnky",
      children: [
        { name: "Batohy", slug: "expedicne-batohy" },
        { name: "Iné", slug: "ine" },
      ],
    },
  ];

  for (const root of hierarchy) {
    await db
      .insert(categories)
      .values({ name: root.name, slug: root.slug })
      .onConflictDoUpdate({
        target: categories.slug,
        set: { name: root.name, parentId: null },
      });

    const [storedRoot] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.slug, root.slug))
      .limit(1);

    if (!storedRoot) {
      throw new Error(`Unable to create or find category "${root.slug}".`);
    }

    for (const child of root.children) {
      await db
        .insert(categories)
        .values({ ...child, parentId: storedRoot.id })
        .onConflictDoUpdate({
          target: categories.slug,
          set: { name: child.name, parentId: storedRoot.id },
        });
    }
  }
}

async function seedCatalogProduct(catalogProduct: CatalogProduct) {
  assertProductImages(
    catalogProduct.slug,
    catalogProduct.images,
  );
  const categoryId = await findOrCreateCategory(catalogProduct.category);
  const [insertedProduct] = await db
    .insert(products)
    .values({
      name: catalogProduct.name,
      slug: catalogProduct.slug,
      description: catalogProduct.description,
      brand: "VERTEX Tatran",
      categoryId,
      audience: catalogProduct.audience ?? "unisex",
    })
    .onConflictDoNothing({ target: products.slug })
    .returning({ id: products.id });

  const [storedProduct] = await db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.slug, catalogProduct.slug))
    .limit(1);
  const productId = insertedProduct?.id ?? storedProduct?.id;

  if (!productId) {
    throw new Error(`Unable to create or find product "${catalogProduct.slug}".`);
  }

  await db.update(products).set({ audience: catalogProduct.audience ?? "unisex" }).where(eq(products.id, productId));

  await db
    .insert(productColors)
    .values({
      productId,
      colorName: catalogProduct.color.name,
      hexCode: catalogProduct.color.hexCode,
    })
    .onConflictDoNothing();

  const [storedColor] = await db
    .select({ id: productColors.id })
    .from(productColors)
    .where(
      and(
        eq(productColors.productId, productId),
        eq(productColors.colorName, catalogProduct.color.name),
      ),
    )
    .limit(1);

  if (!storedColor) {
    throw new Error(`Unable to create color for "${catalogProduct.slug}".`);
  }

  for (const size of ["S", "M", "L", "XL"]) {
    await db
      .insert(productVariants)
      .values({
        productColorId: storedColor.id,
        sku: `${catalogProduct.skuPrefix}-${size}`,
        size,
        price: catalogProduct.price,
        stock: 8,
      })
      .onConflictDoNothing({ target: productVariants.sku });
  }

  for (const image of catalogProduct.images) {
    await seedProductImage({
      productColorId: storedColor.id,
      imageUrl: image.url,
      altText: image.alt,
      isPrimary: image.isPrimary,
      displayOrder: image.order,
    });
  }

}

async function seedColorwayCatalogProduct(catalogProduct: ColorwayCatalogProduct) {
  if (catalogProduct.colorways.length === 0) {
    throw new Error(`Product "${catalogProduct.slug}" must have at least one colorway.`);
  }
  for (const colorway of catalogProduct.colorways) {
    assertProductImages(catalogProduct.slug, colorway.images);
  }

  const categoryId = await findOrCreateCategory(catalogProduct.category);
  const [insertedProduct] = await db
    .insert(products)
    .values({
      name: catalogProduct.name,
      slug: catalogProduct.slug,
      description: catalogProduct.description,
      brand: "VERTEX Tatran",
      categoryId,
      audience: catalogProduct.audience ?? "unisex",
    })
    .onConflictDoNothing({ target: products.slug })
    .returning({ id: products.id });

  const [storedProduct] = await db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.slug, catalogProduct.slug))
    .limit(1);
  const productId = insertedProduct?.id ?? storedProduct?.id;

  if (!productId) {
    throw new Error(`Unable to create or find product "${catalogProduct.slug}".`);
  }

  await db.update(products)
    .set({ audience: catalogProduct.audience ?? "unisex" })
    .where(eq(products.id, productId));

  for (const colorway of catalogProduct.colorways) {
    await db
      .insert(productColors)
      .values({
        productId,
        colorName: colorway.color.name,
        hexCode: colorway.color.hexCode,
      })
      .onConflictDoNothing();

    const [storedColor] = await db
      .select({ id: productColors.id })
      .from(productColors)
      .where(and(
        eq(productColors.productId, productId),
        eq(productColors.colorName, colorway.color.name),
      ))
      .limit(1);

    if (!storedColor) {
      throw new Error(`Unable to create color "${colorway.color.name}" for "${catalogProduct.slug}".`);
    }

    for (const size of catalogProduct.sizes ?? ["S", "M", "L", "XL"]) {
      await db
        .insert(productVariants)
        .values({
          productColorId: storedColor.id,
          sku: `${catalogProduct.skuPrefix}-${colorway.skuSuffix}-${size}`,
          size,
          price: catalogProduct.price,
          stock: 8,
        })
        .onConflictDoNothing({ target: productVariants.sku });
    }

    for (const image of colorway.images) {
      await seedProductImage({
        productColorId: storedColor.id,
        imageUrl: image.url,
        altText: image.alt,
        isPrimary: image.isPrimary,
        displayOrder: image.order,
      });
    }
  }

}

const krivanImages: ProductImage[] = [
  {
    url: "/img/products/krivan-pro-3l/test_jacket_green_front.webp",
    alt: "Kriváň Pro 3L spredu",
    isPrimary: true,
    order: 0,
  },
  {
    url: "/img/products/krivan-pro-3l/test_jacket_green_tilt.webp",
    alt: "Kriváň Pro 3L z uhla",
    isPrimary: false,
    order: 1,
  },
  {
    url: "/img/products/krivan-pro-3l/test_jacket_green_side.webp",
    alt: "Detail kapucne a bočného profilu",
    isPrimary: false,
    order: 2,
  },
];

async function seed() {
  await ensureCategoryHierarchy();
  assertProductImages("krivan-pro-3l", krivanImages);

  const [category] = await db
    .insert(categories)
    .values({ name: "Hardshell bundy", slug: "hardshell-bundy" })
    .onConflictDoNothing({ target: categories.slug })
    .returning({ id: categories.id });
  const [storedCategory] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.slug, "hardshell-bundy"))
    .limit(1);
  const categoryId = category?.id ?? storedCategory?.id;

  if (!categoryId) {
    throw new Error("Unable to create or find the hardshell category.");
  }

  const [product] = await db
    .insert(products)
    .values({
      name: "Kriváň Pro 3L",
      slug: "krivan-pro-3l",
      description: "Expedičná hardshell bunda navrhnutá pre extrémne tatranské podmienky.",
      brand: "VERTEX Tatran",
      categoryId,
      audience: "men",
    })
    .onConflictDoNothing({ target: products.slug })
    .returning({ id: products.id });
  const [storedProduct] = await db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.slug, "krivan-pro-3l"))
    .limit(1);
  const productId = product?.id ?? storedProduct?.id;

  if (!productId) {
    throw new Error("Unable to create or find the Kriváň Pro 3L product.");
  }

  await db
    .update(products)
    .set({ audience: "men" })
    .where(eq(products.id, productId));

  const colors = [
    { colorName: "Lesná zelená", hexCode: "#1b382b" },
  ];

  for (const color of colors) {
    await db.insert(productColors).values({ productId, ...color }).onConflictDoNothing();
    const [storedColor] = await db
      .select({ id: productColors.id })
      .from(productColors)
      .where(and(eq(productColors.productId, productId), eq(productColors.colorName, color.colorName)))
      .limit(1);

    if (!storedColor) {
      throw new Error(`Unable to create or find color "${color.colorName}".`);
    }

    for (const size of ["S", "M", "L", "XL", "XXL"]) {
      await db
        .insert(productVariants)
        .values({
          productColorId: storedColor.id,
          sku: `VT-HSH-01-${color.hexCode.slice(1)}-${size}`,
          size,
          price: "489.00",
          stock: size === "L" ? 2 : 8,
        })
        .onConflictDoNothing({ target: productVariants.sku });
    }
  }

  const [primaryColor] = await db
    .select({ id: productColors.id })
    .from(productColors)
    .where(and(eq(productColors.productId, productId), eq(productColors.colorName, "Lesná zelená")))
    .limit(1);

  if (!primaryColor) {
    throw new Error("Unable to find the primary product color.");
  }

  for (const image of krivanImages) {
    await seedProductImage({
      productColorId: primaryColor.id,
      imageUrl: image.url,
      altText: image.alt,
      isPrimary: image.isPrimary,
      displayOrder: image.order,
    });
  }

  const additionalProducts: CatalogProduct[] = [
    {
      category: {
        name: "Batohy",
        slug: "expedicne-batohy",
      },
      name: "Vertex Alpine 40L",
      slug: "vertex-alpine-40l",
      audience: "unisex",
      description: "Technický expedičný batoh pre dlhé horské výstupy.",
      price: "279.00",
      skuPrefix: "VT-BAG-40L",
      color: {
        name: "Lesná zelená",
        hexCode: "#1b382b",
      },
      images: [
        {
          url: "/img/products/vertex-alpine-40l/test_bag_green_front.webp",
          alt: "Vertex Alpine 40L spredu",
          isPrimary: true,
          order: 0,
        },
        {
          url: "/img/products/vertex-alpine-40l/test_bag_green_back.webp",
          alt: "Vertex Alpine 40L zozadu",
          isPrimary: false,
          order: 1,
        },
        {
          url: "/img/products/vertex-alpine-40l/test_bag_green_side.webp",
          alt: "Vertex Alpine 40L z boku",
          isPrimary: false,
          order: 2,
        },
        {
          url: "/img/products/vertex-alpine-40l/test_bag_green_maneq.webp",
          alt: "Vertex Alpine 40L v teréne",
          isPrimary: false,
          order: 3,
        },
      ],

    },
    {
      category: {
        name: "Technické nohavice",
        slug: "technicke-nohavice",
      },
      name: "Tatran Ripstop Pants",
      slug: "tatran-ripstop-pants",
      audience: "men",
      description: "Odolné technické nohavice pre pohyb v skalnatom teréne.",
      price: "349.00",
      skuPrefix: "VT-PNT-RIP",
      color: {
        name: "Žulová sivá",
        hexCode: "#8b9490",
      },
      images: [
        {
          url: "/img/products/tatran-ripstop-pants/test_trousers_grey_side.webp",
          alt: "Tatran Ripstop Pants z boku",
          isPrimary: true,
          order: 0,
        },
        {
          url: "/img/products/tatran-ripstop-pants/test_trousers_grey_back.webp",
          alt: "Tatran Ripstop Pants zozadu",
          isPrimary: false,
          order: 1,
        },
      ],

    },
  ];

  for (const product of additionalProducts) {
    await seedCatalogProduct(product);
  }

  const newJackets: ColorwayCatalogProduct[] = [
    {
      category: { name: "Hardshell bundy", slug: "hardshell-bundy" },
      name: "Tatran Boreál Insulated Jacket",
      slug: "tatran-boreal-insulated-jacket",
      audience: "men",
      description: "Zateplená bunda s kapucňou na turistiku a pobyt v chladnom počasí.",
      price: "289.00",
      skuPrefix: "VT-BOR-INS",
      colorways: [
        {
          color: { name: "Lesná zelená / antracitová", hexCode: "#1b382b" },
          skuSuffix: "GRN",
          images: [
            {
              url: "/img/products/tatran-boreal-insulated-jacket/jacket-green-men-back.webp",
              alt: "Tatran Boreál Insulated Jacket zozadu",
              isPrimary: true,
              order: 0,
            },
            {
              url: "/img/products/tatran-boreal-insulated-jacket/jacket-men-green-tilt.webp",
              alt: "Tatran Boreál Insulated Jacket z uhla",
              isPrimary: false,
              order: 1,
            },
          ],
        },
      ],

    },
    {
      category: { name: "Hardshell bundy", slug: "hardshell-bundy" },
      name: "Tatran Alpine Shell W",
      slug: "tatran-alpine-shell-w",
      audience: "women",
      description: "Ľahká dámska bunda s kapucňou a bočnými vreckami na turistiku.",
      price: "179.00",
      skuPrefix: "VT-ALP-SHW",
      colorways: [
        {
          color: { name: "Lesná zelená", hexCode: "#456b5b" },
          skuSuffix: "GRN",
          images: [
            {
              url: "/img/products/tatran-alpine-shell-w/jacket-green-women-front.webp",
              alt: "Tatran Alpine Shell W v lesnej zelenej spredu",
              isPrimary: true,
              order: 0,
            },
            {
              url: "/img/products/tatran-alpine-shell-w/jacket-women-green-back.webp",
              alt: "Tatran Alpine Shell W v lesnej zelenej zozadu",
              isPrimary: false,
              order: 1,
            },
            {
              url: "/img/products/tatran-alpine-shell-w/jacket-women-green-side.webp",
              alt: "Bočný pohľad na Tatran Alpine Shell W v lesnej zelenej",
              isPrimary: false,
              order: 2,
            },
            {
              url: "/img/products/tatran-alpine-shell-w/jacket-women-green-tilt.webp",
              alt: "Tatran Alpine Shell W v lesnej zelenej z uhla",
              isPrimary: false,
              order: 3,
            },
          ],
        },
        {
          color: { name: "Snehová biela", hexCode: "#e7e9e4" },
          skuSuffix: "WHT",
          images: [
            {
              url: "/img/products/tatran-alpine-shell-w/jacket-white-women.webp",
              alt: "Tatran Alpine Shell W v snehovej bielej spredu",
              isPrimary: true,
              order: 0,
            },
            {
              url: "/img/products/tatran-alpine-shell-w/jacket-white-women-back.webp",
              alt: "Tatran Alpine Shell W v snehovej bielej zozadu",
              isPrimary: false,
              order: 1,
            },
            {
              url: "/img/products/tatran-alpine-shell-w/jacket-white-women-side.webp",
              alt: "Bočný pohľad na Tatran Alpine Shell W v snehovej bielej",
              isPrimary: false,
              order: 2,
            },
            {
              url: "/img/products/tatran-alpine-shell-w/jacket-white-women-tilt.webp",
              alt: "Tatran Alpine Shell W v snehovej bielej z uhla",
              isPrimary: false,
              order: 3,
            },
          ],
        },
      ],

    },
  ];

  for (const product of newJackets) {
    await seedColorwayCatalogProduct(product);
  }

  await db
    .delete(productImages)
    .where(eq(
      productImages.imageUrl,
      "/img/products/tatran-boreal-insulated-jacket/jacket-green-men-front.webp",
    ));

  const newFootwear: ColorwayCatalogProduct[] = [
    {
      category: { name: "Turistická obuv", slug: "turisticka-obuv" },
      name: "Tatran Alpine Trek Mid",
      slug: "tatran-alpine-trek-mid",
      audience: "unisex",
      description: "Stredne vysoká turistická obuv na celodenné horské túry.",
      price: "149.00",
      skuPrefix: "VT-SHOE-MID",
      sizes: ["38", "39", "40", "41", "42", "43", "44", "45", "46"],
      colorways: [
        {
          color: { name: "Lesná zelená", hexCode: "#456b5b" },
          skuSuffix: "GRN",
          images: [
            {
              url: "/img/products/tatran-alpine-trek-mid/shoes-green-unisex-front.webp",
              alt: "Tatran Alpine Trek Mid v lesnej zelenej spredu",
              isPrimary: true,
              order: 0,
            },
            {
              url: "/img/products/tatran-alpine-trek-mid/shoes-green-unisex-back.webp",
              alt: "Tatran Alpine Trek Mid v lesnej zelenej zozadu",
              isPrimary: false,
              order: 1,
            },
          ],
        },
      ],

    },
    {
      category: { name: "Turistická obuv", slug: "turisticka-obuv" },
      name: "Tatran Summit High",
      slug: "tatran-summit-high",
      audience: "men",
      description: "Vysoká turistická obuv na stabilný krok v horskom teréne.",
      price: "179.00",
      skuPrefix: "VT-SHOE-HIGH",
      sizes: ["40", "41", "42", "43", "44", "45", "46", "47"],
      colorways: [
        {
          color: { name: "Žulová sivá", hexCode: "#8b9490" },
          skuSuffix: "GRY",
          images: [
            {
              url: "/img/products/tatran-summit-high/shoes-high-grey-men-front.webp",
              alt: "Tatran Summit High v žulovej sivej spredu",
              isPrimary: true,
              order: 0,
            },
            {
              url: "/img/products/tatran-summit-high/shoes-high-grey-men-back.webp",
              alt: "Tatran Summit High v žulovej sivej zozadu",
              isPrimary: false,
              order: 1,
            },
            {
              url: "/img/products/tatran-summit-high/shoes-high-grey-men-side.webp",
              alt: "Bočný pohľad na Tatran Summit High v žulovej sivej",
              isPrimary: false,
              order: 2,
            },
            {
              url: "/img/products/tatran-summit-high/shoes-high-grey-men-tilt.webp",
              alt: "Tatran Summit High v žulovej sivej z uhla",
              isPrimary: false,
              order: 3,
            },
          ],
        },
      ],

    },
    {
      category: { name: "Turistická obuv", slug: "turisticka-obuv" },
      name: "Tatran Trail Low W",
      slug: "tatran-trail-low-w",
      audience: "women",
      description: "Nízka turistická obuv na ľahké túry a svižný pohyb v teréne.",
      price: "129.00",
      skuPrefix: "VT-SHOE-LOW-W",
      sizes: ["36", "37", "38", "39", "40", "41", "42"],
      colorways: [
        {
          color: { name: "Tyrkysová", hexCode: "#48aaa5" },
          skuSuffix: "TRQ",
          images: [
            {
              url: "/img/products/tatran-trail-low-w/shoes-low-turq-women-front.webp",
              alt: "Tatran Trail Low W v tyrkysovej spredu",
              isPrimary: true,
              order: 0,
            },
            {
              url: "/img/products/tatran-trail-low-w/shoes-low-turq-women-back.webp",
              alt: "Tatran Trail Low W v tyrkysovej zozadu",
              isPrimary: false,
              order: 1,
            },
            {
              url: "/img/products/tatran-trail-low-w/shoes-low-turq-women-side.webp",
              alt: "Bočný pohľad na Tatran Trail Low W v tyrkysovej",
              isPrimary: false,
              order: 2,
            },
            {
              url: "/img/products/tatran-trail-low-w/shoes-low-turq-women-tilt.webp",
              alt: "Tatran Trail Low W v tyrkysovej z uhla",
              isPrimary: false,
              order: 3,
            },
          ],
        },
      ],

    },
  ];

  for (const product of newFootwear) {
    await seedColorwayCatalogProduct(product);
  }

  await db
    .delete(productImages)
    .where(sql`${productImages.imageUrl} ILIKE '%.png'`);

  const variantsWithoutImages = await db
    .select({ id: productVariants.id })
    .from(productVariants)
    .innerJoin(productColors, eq(productVariants.productColorId, productColors.id))
    .leftJoin(productImages, eq(productImages.productColorId, productColors.id))
    .groupBy(productVariants.id)
    .having(sql`count(${productImages.id}) = 0`);
  const variantIdsWithoutImages = variantsWithoutImages.map(
    (variant) => variant.id,
  );

  if (variantIdsWithoutImages.length > 0) {
    const referencedVariants = await db
      .select({ variantId: orderItems.productVariantId })
      .from(orderItems)
      .where(inArray(orderItems.productVariantId, variantIdsWithoutImages));

    if (referencedVariants.length > 0) {
      throw new Error(
        "Cannot remove variants without images because they are referenced by order history.",
      );
    }

    await db
      .delete(productVariants)
      .where(inArray(productVariants.id, variantIdsWithoutImages));
  }

  await db
    .delete(productColors)
    .where(sql`
      NOT EXISTS (
        SELECT 1 FROM ${productImages}
        WHERE ${productImages.productColorId} = ${productColors.id}
      )
      AND NOT EXISTS (
        SELECT 1 FROM ${productVariants}
        WHERE ${productVariants.productColorId} = ${productColors.id}
      )
    `);

  const productsWithoutImages = await db
    .select({ slug: products.slug })
    .from(products)
    .leftJoin(productColors, eq(productColors.productId, products.id))
    .leftJoin(productImages, eq(productImages.productColorId, productColors.id))
    .groupBy(products.id)
    .having(sql`count(${productImages.id}) = 0`);

  if (productsWithoutImages.length > 0) {
    throw new Error(
      `Products without images remain in the database: ${productsWithoutImages
        .map((product) => product.slug)
        .join(", ")}`,
    );
  }

  console.log("Seed completed: catalog products and related data.");
}

seed()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$client.end();
  });
