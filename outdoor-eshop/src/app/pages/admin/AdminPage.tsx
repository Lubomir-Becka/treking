"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { logout } from "@/features/session/composition/client";
import { CategoryManagement } from "./categories/CategoryManagement";
import type { AdminCategory } from "@/features/products/domain/CategoryManagement";
import styles from "./admin.module.css";

export function AdminPage({ initialCategories }: { initialCategories: AdminCategory[] }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogout() {
    setPending(true);
    setError(null);
    try {
      await logout();
      router.push("/login");
      router.refresh();
    } catch (logoutError) {
      setError(
        logoutError instanceof Error
          ? logoutError.message
          : "Odhlásenie sa nepodarilo.",
      );
      setPending(false);
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <span className={styles.brand}>VERTEX Tatran</span>
        <button type="button" onClick={handleLogout} disabled={pending}>
          {pending ? "Odhlasovanie…" : "Odhlásiť sa"}
        </button>
      </div>
      <section className={styles.content}>
        <h1>Administrácia</h1>
        <p>Vitajte v administrácii obchodu.</p>
        <CategoryManagement initialCategories={initialCategories} />
        {error && <p role="alert">{error}</p>}
      </section>
    </main>
  );
}
