"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AdminCustomer } from "@/features/session/domain/AdminCustomers";
import styles from "./admin.module.css";

function isCustomerList(value: unknown): value is AdminCustomer[] {
  return Array.isArray(value) && value.every((item: unknown) =>
    item !== null && typeof item === "object" &&
    "id" in item && typeof item.id === "number" &&
    "firstName" in item && typeof item.firstName === "string" &&
    "lastName" in item && typeof item.lastName === "string" &&
    "email" in item && typeof item.email === "string" &&
    "phone" in item && (typeof item.phone === "string" || item.phone === null) &&
    "isActive" in item && typeof item.isActive === "boolean");
}

export function CustomerManagement({
  initialCustomers,
  active,
}: {
  initialCustomers: AdminCustomer[];
  active: boolean;
}) {
  const [customers, setCustomers] = useState(initialCustomers);
  const [busy, setBusy] = useState(false);
  const [needsRefresh, setNeedsRefresh] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const operationInProgress = useRef(false);

  const load = useCallback(async () => {
    const response = await fetch("/api/admin/customers", { cache: "no-store" });
    if (!response.ok) throw new Error("Zoznam účtov sa nepodarilo obnoviť.");
    const result: unknown = await response.json();
    if (!result || typeof result !== "object" || !("data" in result) || !isCustomerList(result.data)) {
      throw new Error("Server vrátil neplatný zoznam účtov.");
    }
    setCustomers(result.data);
  }, []);

  const refresh = useCallback(async () => {
    if (operationInProgress.current) return;
    operationInProgress.current = true;
    setBusy(true);
    try {
      await load();
      setNeedsRefresh(false);
      setMessage(null);
    } catch (error) {
      setNeedsRefresh(true);
      setMessage(error instanceof Error ? error.message : "Zoznam sa nepodarilo obnoviť.");
    } finally {
      operationInProgress.current = false;
      setBusy(false);
    }
  }, [load]);

  useEffect(() => {
    if (active) void refresh();
  }, [active, refresh]);

  async function change(customer: AdminCustomer, action: "delete" | "active") {
    const prompt = action === "delete"
      ? `Trvalo odstrániť účet ${customer.email} a všetky jeho objednávky? Túto operáciu nemožno vrátiť.`
      : `${customer.isActive ? "Deaktivovať" : "Aktivovať"} účet ${customer.email}?`;
    if (operationInProgress.current || needsRefresh || !window.confirm(prompt)) return;
    operationInProgress.current = true;
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/customers/${customer.id}`, action === "delete"
        ? { method: "DELETE" }
        : {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ active: !customer.isActive }),
        });
      if (!response.ok) {
        if (response.status >= 500) setNeedsRefresh(true);
        const result: unknown = await response.json();
        throw new Error(
          result && typeof result === "object" && "error" in result && typeof result.error === "string"
            ? result.error : "Účet sa nepodarilo upraviť.",
        );
      }
      setNeedsRefresh(true);
      const result: unknown = await response.json();
      if (!result || typeof result !== "object" || !("data" in result) ||
        !result.data || typeof result.data !== "object" ||
        !("success" in result.data) || result.data.success !== true) {
        throw new Error("Výsledok zmeny nie je známy. Obnovte zoznam.");
      }
      await load();
      setNeedsRefresh(false);
      setMessage(action === "delete"
        ? "Účet a jeho objednávky boli odstránené."
        : `Účet bol ${customer.isActive ? "deaktivovaný" : "aktivovaný"}.`);
    } catch (error) {
      if (error instanceof TypeError) setNeedsRefresh(true);
      setMessage(error instanceof Error ? error.message : "Výsledok zmeny nie je známy.");
    } finally {
      operationInProgress.current = false;
      setBusy(false);
    }
  }

  return (
    <section className={styles.categories}>
      <h2>Správa zákazníckych účtov</h2>
      <p>Deaktivácia zabráni prihláseniu. Odstránenie účtu trvalo odstráni aj jeho objednávky.</p>
      {message && <p role="status">{message}</p>}
      {needsRefresh && <button type="button" disabled={busy} onClick={() => void refresh()}>Obnoviť zoznam</button>}
      {!busy && !needsRefresh && customers.length === 0 && <p>Zatiaľ nie sú registrovaní žiadni zákazníci.</p>}
      <ul className={styles.categoryList}>
        {customers.map((customer) => (
          <li key={customer.id} className={styles.categoryItem}>
            <div>
              <strong>{customer.firstName} {customer.lastName}</strong>
              <p>{customer.email} · {customer.isActive ? "Aktívny" : "Deaktivovaný"}</p>
            </div>
            <div className={styles.actions}>
              <button type="button" disabled={busy || needsRefresh} onClick={() => void change(customer, "active")}>
                {customer.isActive ? "Deaktivovať" : "Aktivovať"}
              </button>
              <button type="button" disabled={busy || needsRefresh} onClick={() => void change(customer, "delete")}>
                Odstrániť účet
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
