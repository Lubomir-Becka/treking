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
  const fullName = `${user.firstName} ${user.lastName}`;
  const defaultAddress =
    accountData.addresses.find((address) => address.isDefault) ??
    accountData.addresses[0];
  const stats = [
    ["Objednávky", String(accountData.orders.length), "Celkovo"],
    ["Uložené adresy", String(accountData.addresses.length), "V profile"],
  ];

  return (
    <main className={styles.page}>
      <nav className={styles.breadcrumbs} aria-label="Drobková navigácia">
        <Link href="/">Úvod</Link>
        <span>/</span>
        <Link href="/account">Zákaznícky portál</Link>
        <span>/</span>
        <span>Prehľad profilu</span>
      </nav>
      <section className={styles.accountHero}>
        <div>
          <span className={styles.kicker}>Overený účet ✓</span>
          <h1>{fullName}</h1>
          <p>{user.email}</p>
          <span className={styles.securityBadge}>● Účet je aktívny</span>
        </div>
        <div className={styles.stats}>
          {stats.map(([label, value, detail]) => (
            <div className={styles.stat} key={label}>
              <span>{label}</span><strong>{value}</strong><small>{detail}</small>
            </div>
          ))}
        </div>
      </section>

      <div className={styles.accountLayout}>
        <aside className={styles.sidebar}>
          <nav aria-label="Navigácia účtu">
            <Link className={styles.activeNav} href="/account">Prehľad profilu</Link>
            <Link href="/account#orders">História objednávok <b>{accountData.orders.length}</b></Link>
            <Link href="/account#addresses">Uložené adresy <b>{accountData.addresses.length}</b></Link>
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

          <article className={styles.dashboardCard} id="addresses">
            <span className={styles.kicker}>Doručovanie</span>
            <h2>Uložené adresy</h2>
            {defaultAddress ? (
              <p>{defaultAddress.recipientName}<br />{defaultAddress.street}<br />{defaultAddress.postalCode} {defaultAddress.city}</p>
            ) : (
              <p>Zatiaľ nemáte uloženú žiadnu adresu.</p>
            )}
          </article>
        </section>
      </div>
    </main>
  );
}
