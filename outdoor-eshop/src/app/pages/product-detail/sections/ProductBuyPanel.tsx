import type { CSSProperties } from "react";
import Image from "next/image";
import { CustomerFavoriteButton } from "@/app/_components/customer/client";
import type { ProductDetail } from "@/features/products/domain/product";
import styles from "./product-buy-panel.module.css";

type ProductBuyPanelProps = {
  product: ProductDetail;
  selectedColor: ProductDetail["colors"][number] | undefined;
  variants: ProductDetail["colors"][number]["variants"];
  selectedSize: string;
  selectedVariant: ProductDetail["colors"][number]["variants"][number] | undefined;
  price: number | null;
  added: boolean;
  cartError: string | null;
  onChooseColor: (color: ProductDetail["colors"][number]) => void;
  onChooseSize: (size: string) => void;
  onAddToCart: () => void;
};

export function ProductBuyPanel({
  product,
  selectedColor,
  variants,
  selectedSize,
  selectedVariant,
  price,
  added,
  cartError,
  onChooseColor,
  onChooseSize,
  onAddToCart,
}: ProductBuyPanelProps) {
  const uniqueSizes = Array.from(
    new Set(variants.map((variant) => variant.size).filter(Boolean)),
  );
  const isOutOfStock = !selectedVariant || selectedVariant.stock < 1;

  return (
    <div className={styles.panel}>
      <span className="eyebrow">
        {product.brand}
        {product.category ? ` · ${product.category}` : ""}
      </span>
      <div className={styles.title}>
        <h1>{product.name}</h1>
        {selectedColor && (
          <CustomerFavoriteButton
            colorId={selectedColor.id}
            className={styles.favorite}
          />
        )}
      </div>
      <p className={styles.description}>
        {product.description ?? "Technická výbava pre náročné podmienky."}
      </p>
      <div className={styles.price}>
        {price === null
          ? "Cena na vyžiadanie"
          : price.toLocaleString("sk-SK", {
              style: "currency",
              currency: "EUR",
            })}
        <small>Vrátane DPH · cena dopravy v košíku</small>
      </div>

      {product.colors.length > 0 && (
        <fieldset className={styles.choice}>
          <legend>
            Farba <strong>{selectedColor?.name}</strong>
          </legend>
          <div className={styles.colors}>
            {product.colors.map((color) => (
              <button
                key={color.id}
                type="button"
                className={color.id === selectedColor?.id ? styles.active : ""}
                style={{ "--swatch": color.hexCode } as CSSProperties}
                onClick={() => onChooseColor(color)}
                aria-label={color.name}
              />
            ))}
          </div>
        </fieldset>
      )}

      {variants.length > 0 && (
        <fieldset className={styles.choice}>
          <legend>Veľkosť</legend>
          <div className={styles.sizes}>
            {uniqueSizes.map((size) => (
              <button
                key={size}
                type="button"
                className={selectedSize === size ? styles.active : ""}
                onClick={() => onChooseSize(size ?? "")}
              >
                {size}
              </button>
            ))}
          </div>
          {selectedVariant && (
            <small className={styles.stock}>
              {selectedVariant.stock > 0
                ? `Skladom: ${selectedVariant.stock} ks`
                : "Momentálne vypredané"}
            </small>
          )}
        </fieldset>
      )}

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.addButton}
          disabled={isOutOfStock}
          onClick={onAddToCart}
        >
          <span>{added ? "Pridané do košíka" : "Vložiť do košíka"}</span>
          <Image
            src="/img/ui/shopping-cart.svg"
            alt=""
            aria-hidden="true"
            width={18}
            height={18}
          />
        </button>
      </div>
      {cartError && <p role="alert">{cartError}</p>}
    </div>
  );
}
