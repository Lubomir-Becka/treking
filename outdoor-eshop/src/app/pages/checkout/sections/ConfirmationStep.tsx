"use client";

import Link from "next/link";
import type { CreatedOrder } from "../client";
import { formatPrice } from "./OrderSummary";
import styles from "../Checkout.module.css";

export function ConfirmationStep({ order }: { order: CreatedOrder | null }) {
  return (
    <div className={styles.checkoutEmpty}>
      {order ? (
        <>
          <span className={styles.checkoutEyebrow}>Objednávka prijatá</span>
          <h1>Ďakujeme za objednávku.</h1>
          <p>Číslo objednávky: {order.orderNumber}</p>
          <p>Zaplatíte pri prevzatí. Online platba ani e-mailové potvrdenie nie sú dostupné.</p>
          <strong>{formatPrice(order.totalPrice)}</strong>
        </>
      ) : (
        <>
          <span className={styles.checkoutEyebrow}>Objednávku sa nepodarilo overiť</span>
          <h1>Skontrolujte stav objednávky.</h1>
          <p>Ak ste objednávku už odoslali, nájdete ju vo svojom zákazníckom účte.</p>
        </>
      )}
      <Link className={styles.checkoutBack} href="/">
        Späť na domovskú stránku
      </Link>
    </div>
  );
}
