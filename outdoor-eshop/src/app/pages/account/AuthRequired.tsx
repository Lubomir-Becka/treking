import Link from "next/link";
import styles from "./account.module.css";

export function AuthRequired() {
  return (
    <main className={styles.authRequired}>
      <span className={styles.kicker}>Zákaznícky účet</span>
      <h1>Najskôr sa prihláste</h1>
      <p>
        Profil, objednávky a uložené údaje sú dostupné až po registrácii alebo
        prihlásení.
      </p>
      <div className={styles.authActions}>
        <Link className={styles.authPrimary} href="/login?next=/account">
          Pokračovať k účtu
        </Link>
      </div>
    </main>
  );
}
