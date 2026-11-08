import Link from "next/link";
import type { CustomerOrderDetail } from "@/features/customer/domain/CustomerAccountRepository";
import styles from "./account.module.css";

function price(value: number) {
  return value.toLocaleString("sk-SK", { style: "currency", currency: "EUR" });
}

export function OrderDetailPage({ order }: { order: CustomerOrderDetail }) {
  return (
    <main className={styles.page}>
      <nav className={styles.breadcrumbs} aria-label="Drobková navigácia">
        <Link href="/account#orders">Moje objednávky</Link>
        <span> / {order.orderNumber}</span>
      </nav>
      <section className={styles.dashboardCard}>
        <h1>Objednávka {order.orderNumber}</h1>
        <p>Stav: {order.status}</p>
        {order.createdAt && <p>Dátum: {order.createdAt.toLocaleDateString("sk-SK")}</p>}
        <h2>Položky</h2>
        <ul className={styles.orderList}>
          {order.items.map((item) => (
            <li className={styles.shipment} key={item.id}>
              <div>
                <strong>{item.productName}</strong>
                <span>SKU: {item.sku}</span>
                {item.colorName && <span>Farba: {item.colorName}</span>}
                {item.size && <span>Veľkosť: {item.size}</span>}
                <span>{item.quantity} × {price(item.unitPrice)}</span>
              </div>
              <strong>{price(item.quantity * item.unitPrice)}</strong>
            </li>
          ))}
        </ul>
        <p>Produkty: {price(order.itemsSubtotal)}</p>
        <p>Doprava: {order.shippingMethod ?? "Neuvedená"} · {price(order.shippingCost)}</p>
        <p><strong>Spolu: {price(order.totalPrice)}</strong></p>
        <h2>Dodacie údaje</h2>
        <p>
          {order.recipient}<br />
          {order.street}<br />
          {order.postalCode} {order.city}<br />
          {order.country}<br />
          {order.phone}<br />
          {order.customerEmail}
        </p>
        {order.note && <p>Poznámka: {order.note}</p>}
      </section>
    </main>
  );
}
