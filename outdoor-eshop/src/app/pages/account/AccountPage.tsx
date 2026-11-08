import Link from "next/link";
import type {
  CustomerAccountData,
  CustomerProfile,
} from "@/features/customer/domain/CustomerAccountRepository";
import { ProfileSettings } from "./ProfileSettings";
import styles from "./account.module.css";

function formatPrice(value: number) {
  return value.toLocaleString("sk-SK", { style: "currency", currency: "EUR" });
}

function formatStatus(status: string) {
  return {
    pending: "Čaká na spracovanie",
    processing: "Spracováva sa",
    shipped: "Odoslaná",
    delivered: "Doručená",
    cancelled: "Zrušená",
  }[status] ?? status;
}

export function AccountPage({
  user,
  accountData,
}: {
  user: CustomerProfile;
  accountData: CustomerAccountData;
}) {
  return (
    <main className={styles.page}>
      <nav className={styles.breadcrumbs} aria-label="Drobková navigácia">
        <Link href="/">Úvod</Link>
        <span>/</span>
        <Link href="/account">Zákaznícky portál</Link>
        <span>/</span>
        <span>Prehľad profilu</span>
      </nav>
      <div className={styles.accountLayout}>
        <aside className={styles.sidebar}>
          <nav aria-label="Navigácia účtu">
            <Link className={styles.activeNav} href="/account">Prehľad profilu</Link>
            <Link href="/account#orders">História objednávok <b>{accountData.orders.length}</b></Link>
          </nav>
        </aside>

        <section className={styles.dashboard}>
          <ProfileSettings user={user} />
          <article className={styles.dashboardCard} id="orders">
            <div className={styles.cardTitle}>
              <div><span className={styles.kicker}>Objednávky</span><h2>Moje objednávky</h2></div>
            </div>
            {accountData.orders.length > 0 ? (
              <ul className={styles.orderList}>
                {accountData.orders.map((order) => (
                  <li key={order.orderNumber}>
                    <Link className={styles.shipment} href={`/account/orders/${encodeURIComponent(order.orderNumber)}`}>
                      <div>
                        <strong>{order.orderNumber}</strong>
                        <span>{formatStatus(order.status)}</span>
                        {order.createdAt && <span>{order.createdAt.toLocaleDateString("sk-SK")}</span>}
                      </div>
                      <strong>{formatPrice(order.totalPrice)}</strong>
                      <span>Detail objednávky →</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p>Zatiaľ nemáte žiadne objednávky.</p>
            )}
          </article>
        </section>
      </div>
    </main>
  );
}
