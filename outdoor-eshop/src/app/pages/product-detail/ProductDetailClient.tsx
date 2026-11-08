"use client";

import { useState } from "react";
import { Footer } from "@/app/_components/Footer/Footer";
import { Header } from "@/app/_components/Header/Header";
import Link from "next/link";
import { addItemToCart } from "@/features/cart/composition/client";
import type { ProductDetail } from "@/features/products/domain/product";
import { ProductBuyPanel } from "./sections/ProductBuyPanel";
import { ProductGallery } from "./sections/ProductGallery";
import { ProductSpecifications } from "./sections/ProductSpecifications";
import styles from "./product.module.css";

export default function ProductDetailClient({
  product,
  initialColorId,
}: {
  product: ProductDetail;
  initialColorId?: number;
}) {
  const firstColor =
    product.colors.find((color) => color.id === initialColorId) ??
    product.colors[0];
  const [selectedColorId, setSelectedColorId] = useState(firstColor?.id);
  const [selectedImage, setSelectedImage] = useState(
    Math.max(0, firstColor?.images.findIndex((image) => image.isPrimary) ?? -1),
  );
  const [selectedSize, setSelectedSize] = useState(
    firstColor?.variants[0]?.size ?? "",
  );
  const [added, setAdded] = useState(false);
  const [cartError, setCartError] = useState<string | null>(null);

  const selectedColor =
    product.colors.find((color) => color.id === selectedColorId) ?? firstColor;
  const variants = selectedColor?.variants ?? [];
  const selectedVariant = variants.find(
    (variant) => variant.size === selectedSize,
  );
  const price = selectedVariant?.price ?? product.price;
  const isOutOfStock = !selectedVariant || selectedVariant.stock < 1;

  function chooseColor(color: ProductDetail["colors"][number]) {
    setSelectedColorId(color.id);
    setSelectedImage(Math.max(0, color.images.findIndex((image) => image.isPrimary)));
    setSelectedSize(color.variants[0]?.size ?? "");
  }

  async function addSelectedVariantToCart() {
    if (!selectedVariant || !selectedColor) {
      return;
    }

    setCartError(null);
    try {
      await addItemToCart(selectedVariant.id);
      setAdded(true);
    } catch (error) {
      setCartError(
        error instanceof Error
          ? error.message
          : "Produkt sa nepodarilo pridať do košíka.",
      );
    }
  }

  return (
    <div className={`site-shell ${styles["product-page"]}`}>
      <Header />
      <main>
        <div className={styles["product-container"]}>
          <nav
            className={styles["product-breadcrumbs"]}
            aria-label="Drobková navigácia"
          >
            <Link href="/">Úvod</Link>
            <span>/</span>
            <Link
              href={
                product.categorySlug
                  ? `/categories/${product.categorySlug}`
                  : "/search"
              }
            >
              {product.category ?? "Kolekcia"}
            </Link>
            <span>/</span>
            <strong>{product.name}</strong>
          </nav>

          <div className={styles["product-code"]}>
            Kód produktu: {selectedVariant?.sku ?? product.slug}
          </div>

          <section className={styles["product-purchase"]}>
            <ProductGallery
              images={selectedColor?.images ?? []}
              selectedImage={selectedImage}
              onSelectImage={setSelectedImage}
            />
            <ProductBuyPanel
              product={product}
              selectedColor={selectedColor}
              variants={variants}
              selectedSize={selectedSize}
              selectedVariant={selectedVariant}
              price={price}
              added={added}
              cartError={cartError}
              onChooseColor={chooseColor}
              onChooseSize={setSelectedSize}
              onAddToCart={addSelectedVariantToCart}
            />
          </section>

          <ProductSpecifications
            product={product}
            variantCount={variants.length}
          />
        </div>
      </main>
      <Footer />

      <div className={styles["product-mobile-cart"]}>
        <div>
          <strong>{product.name}</strong>
          <span>{price === null ? "Cena na vyžiadanie" : `${price} €`}</span>
        </div>
        <button
          type="button"
          disabled={isOutOfStock}
          onClick={addSelectedVariantToCart}
        >
          {added ? "Pridané ✓" : "Vložiť do košíka"}
        </button>
      </div>
    </div>
  );
}
