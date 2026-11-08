"use client";

import type { CartItem } from "@/features/cart/domain/Cart";
import styles from "../Checkout.module.css";

export function formatPrice(value: number) {
  return value.toLocaleString("sk-SK", {
    style: "currency",
    currency: "EUR",
  });
}

export function OrderSummary({
  items,
  shippingCost,
}: {
  items: CartItem[];
  shippingCost?: number | null;
}) {
  const subtotal = items.reduce(
    (total, item) => total + item.unitPrice * item.quantity,
    0,
  );
  const total = shippingCost == null ? null : subtotal + shippingCost;

  return (
    <aside className={styles.checkoutSummary}>
      <h2>Zhrnutie objednávky</h2>
      <div className={styles.checkoutSummaryRows}>
        <div className={styles.checkoutSummaryRow}>
          <span>Medzisúčet tovaru</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        <div className={styles.checkoutSummaryRow}>
          <span>Doprava</span>
          <span>
            {shippingCost === undefined
              ? "V ďalšom kroku"
              : shippingCost === null
                ? "Nedostupná"
                : shippingCost === 0
                  ? "ZADARMO"
                  : formatPrice(shippingCost)}
          </span>
        </div>
      </div>
      <div className={styles.checkoutTotal}>
        <span>Spolu s DPH</span>
        <strong>{total === null ? "Bude upresnené" : formatPrice(total)}</strong>
      </div>
    </aside>
  );
}
