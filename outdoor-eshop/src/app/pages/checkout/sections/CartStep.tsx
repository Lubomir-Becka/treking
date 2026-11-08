"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { CartItem } from "@/features/cart/domain/Cart";
import { MAX_CART_ITEM_QUANTITY } from "@/features/cart/domain/cartQuantities";
import { removeCartItem, updateCartItem } from "@/features/cart/composition/client";
import { formatPrice, OrderSummary } from "./OrderSummary";
import styles from "../Checkout.module.css";

export function CartStep({
  items,
  setItems,
  isLoading,
  loadError,
  onRetry,
}: {
  items: CartItem[];
  setItems: Dispatch<SetStateAction<CartItem[]>>;
  isLoading: boolean;
  loadError: string | null;
  onRetry: () => void;
}) {
  const router = useRouter();
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updatingItemId, setUpdatingItemId] = useState<number | null>(null);

  async function updateQuantity(item: CartItem, change: number) {
    if (!item.id) return;
    const quantity = item.quantity + change;
    setUpdateError(null);
    setUpdatingItemId(item.id);
    try {
      const cart = quantity > 0
        ? await updateCartItem(item.id, quantity)
        : await removeCartItem(item.id);
      setItems(cart.items);
    } catch {
      setUpdateError("Zmenu košíka sa nepodarilo uložiť. Skúste to znova.");
    } finally {
      setUpdatingItemId(null);
    }
  }

  function continueToShipping() {
    if (items.some((item) => item.quantity > item.stock || item.quantity > MAX_CART_ITEM_QUANTITY)) {
      setUpdateError("Upravte množstvo položiek podľa dostupnosti a limitu 99 kusov.");
      return;
    }
    if (items.length > 0) router.push("/checkout/shipping");
  }

  return (
    <>
      <div className={styles.checkoutTitle}>
        <span className={styles.checkoutEyebrow}>Krok 1 z 3 · Prehľad</span>
        <h1>Košík & objednávka</h1>
      </div>
      {loadError ? (
        <div className={styles.checkoutEmpty} role="alert">
          <p>{loadError}</p>
          <button type="button" onClick={onRetry}>Skúsiť znova</button>
        </div>
      ) : isLoading ? (
        <div className={styles.checkoutEmpty} role="status">
          <p>Načítavame košík…</p>
        </div>
      ) : items.length === 0 ? (
        <div className={styles.checkoutEmpty}>
          <p>Košík je zatiaľ prázdny.</p>
          <Link className={styles.checkoutBack} href="/search">
            Späť do katalógu
          </Link>
        </div>
      ) : (
        <div className={styles.checkoutLayout}>
          <section className={styles.checkoutPanel}>
            <h2>Výstroj v košíku</h2>
            {updateError && <p role="alert">{updateError}</p>}
            {items.map((item) => (
              <article className={styles.checkoutCartItem} key={item.variantId}>
                <div className={styles.checkoutProductImage}>
                  {item.imageUrl && <img src={item.imageUrl} alt="" />}
                </div>
                <div className={styles.checkoutProductMeta}>
                  <h3>{item.productName}</h3>
                  <div className={styles.checkoutProductOptions}>
                    <span className={styles.checkoutProductOption}>
                      <small>Farba</small>
                      <strong>{item.colorName ?? "Neuvedená"}</strong>
                    </span>
                    <span className={styles.checkoutProductOption}>
                      <small>Veľkosť</small>
                      <strong>{item.size ?? "Neuvedená"}</strong>
                    </span>
                  </div>
                  <p>{item.stock > 0 ? `Skladom: ${item.stock} kusov` : "Momentálne nedostupné"}</p>
                  {(item.quantity > item.stock || item.quantity > MAX_CART_ITEM_QUANTITY) && (
                    <div role="alert">
                      <p>Upravte množstvo. Dostupných: {item.stock}, maximum: 99 kusov.</p>
                      <button
                        type="button"
                        disabled={updatingItemId === item.id}
                        onClick={() => updateQuantity(item, Math.min(item.stock, MAX_CART_ITEM_QUANTITY) - item.quantity)}
                      >
                        {item.stock > 0
                          ? `Upraviť na ${Math.min(item.stock, MAX_CART_ITEM_QUANTITY)} kusov`
                          : "Odstrániť nedostupnú položku"}
                      </button>
                    </div>
                  )}
                  <div className={styles.checkoutQuantity}>
                    <button
                      type="button"
                      disabled={updatingItemId === item.id}
                      onClick={() => updateQuantity(item, -1)}
                      aria-label={`Znížiť množstvo produktu ${item.productName}`}
                    >
                      −
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      type="button"
                      disabled={updatingItemId === item.id}
                      onClick={() => updateQuantity(item, 1)}
                      aria-label={`Zvýšiť množstvo produktu ${item.productName}`}
                    >
                      +
                    </button>
                  </div>
                  <button
                    className={styles.checkoutRemove}
                    type="button"
                    disabled={updatingItemId === item.id}
                    onClick={() => updateQuantity(item, -item.quantity)}
                  >
                    Odstrániť z košíka
                  </button>
                </div>
                <strong className={styles.checkoutProductPrice}>
                  {formatPrice(item.unitPrice * item.quantity)}
                </strong>
              </article>
            ))}
            <Link className={styles.checkoutBack} href="/search">
              ← Pokračovať v nákupe výbavy
            </Link>
          </section>
          <div>
            <OrderSummary items={items} />
            <button
              className={styles.checkoutButton}
              type="button"
              onClick={continueToShipping}
            >
              Pokračovať na dopravu →
            </button>
          </div>
        </div>
      )}
      {items.length > 0 && (
        <div className={styles.checkoutMobileBar}>
          <strong>
            {formatPrice(items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0))}
          </strong>
          <button className={styles.checkoutButton} type="button" onClick={continueToShipping}>
            Doprava →
          </button>
        </div>
      )}
    </>
  );
}
