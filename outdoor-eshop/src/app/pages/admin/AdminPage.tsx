"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { logout } from "@/features/session/composition/client";
import { CategoryManagement } from "./categories/CategoryManagement";
import { CustomerManagement } from "./CustomerManagement";
import { ProductManagement } from "./ProductManagement";
import type { AdminCategory } from "@/features/products/domain/CategoryManagement";
import type { AdminProduct } from "@/features/products/domain/AdminProducts";
import type { AdminCustomer } from "@/features/session/domain/AdminCustomers";
import styles from "./admin.module.css";

export function AdminPage({
  initialCategories,
  initialCustomers,
  initialProducts,
}: {
  initialCategories: AdminCategory[];
  initialCustomers: AdminCustomer[];
  initialProducts: AdminProduct[];
}) {
  const router = useRouter();
  const [activePanel, setActivePanel] = useState<"categories" | "products" | "customers">("categories");
  const [categories, setCategories] = useState(initialCategories);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogout() {
    setPending(true);
    setError(null);
    try {
      await logout();
      router.push("/admin/login");
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
        <nav className={styles.navigation} aria-label="Správa obchodu">
          <button
            type="button"
            aria-current={activePanel === "categories" ? "page" : undefined}
            onClick={() => setActivePanel("categories")}
          >
            Kategórie
          </button>
          <button
            type="button"
            aria-current={activePanel === "products" ? "page" : undefined}
            onClick={() => setActivePanel("products")}
          >
            Produkty
          </button>
          <button
            type="button"
            aria-current={activePanel === "customers" ? "page" : undefined}
            onClick={() => setActivePanel("customers")}
          >
            Účty
          </button>
        </nav>
        <div hidden={activePanel !== "categories"}>
          <CategoryManagement categories={categories} onCategoriesChange={setCategories} />
        </div>
        <div hidden={activePanel !== "products"}>
          <ProductManagement initialProducts={initialProducts} categories={categories} />
        </div>
        <div hidden={activePanel !== "customers"}>
          <CustomerManagement initialCustomers={initialCustomers} active={activePanel === "customers"} />
        </div>
        {error && <p role="alert">{error}</p>}
      </section>
    </main>
  );
}
