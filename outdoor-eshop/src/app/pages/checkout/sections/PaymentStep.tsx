"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import type { CartItem } from "@/features/cart/domain/Cart";
import type { CheckoutDetails } from "@/features/checkout/domain/checkout";
import { submitOrder as submitOrderRequest, OrderOutcomeUnknownError, type CreatedOrder } from "../client";
import { OrderSummary } from "./OrderSummary";
import styles from "../Checkout.module.css";

export function PaymentStep({
  items,
  details,
  shippingCost,
  shippingError,
  onOrderCreated,
}: {
  items: CartItem[];
  details: CheckoutDetails;
  shippingCost: number | null;
  shippingError: string | null;
  onOrderCreated: (order: CreatedOrder) => void;
}) {
  const router = useRouter();
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderCompleted, setOrderCompleted] = useState(false);
  const [outcomeUnknown, setOutcomeUnknown] = useState(false);

  async function submitOrder() {
    setIsSubmitting(true);
    setOrderError(null);
    try {
      const order = await submitOrderRequest(details, termsAccepted);
      setOrderCompleted(true);
      try {
        onOrderCreated(order);
      } catch {
        setOrderError(`Objednávka ${order.orderNumber} bola prijatá, ale potvrdenie sa nepodarilo uložiť. Nájdete ju v zákazníckom účte.`);
        return;
      }
      router.push("/checkout/confirmation");
    } catch (error) {
      if (error instanceof OrderOutcomeUnknownError) setOutcomeUnknown(true);
      setOrderError(error instanceof Error ? error.message : "Objednávku sa nepodarilo vytvoriť. Skúste to znova.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <div className={styles.checkoutTitle}>
        <span className={styles.checkoutEyebrow}>Krok 3 z 3 · Dokončenie</span>
        <h1>Potvrdenie objednávky</h1>
      </div>
      <div className={styles.checkoutLayout}>
        <section>
          <div className={styles.checkoutPanel}>
            <h2>Platba pri prevzatí</h2>
            <p>Objednávku zaplatíte pri prevzatí. Online platba zatiaľ nie je dostupná.</p>
          </div>
          {shippingError && <p role="alert">{shippingError}</p>}
          <div className={styles.checkoutPanel}>
            <h2>Potvrdenie objednávky</h2>
            <label>
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(event) => setTermsAccepted(event.target.checked)}
              />{" "}
              Súhlasím s obchodnými podmienkami a spracovaním osobných údajov.
            </label>
          </div>
          <button
            className={styles.checkoutButton}
            type="button"
            disabled={!termsAccepted || isSubmitting || orderCompleted || outcomeUnknown || shippingCost === null}
            onClick={submitOrder}
          >
            Záväzne objednať s platbou pri prevzatí
          </button>
          {orderError && <p role="alert">{orderError}</p>}
          {outcomeUnknown && <Link href="/account#orders">Pozrieť objednávky v účte</Link>}
        </section>
        <OrderSummary items={items} shippingCost={shippingCost} />
      </div>
    </>
  );
}
