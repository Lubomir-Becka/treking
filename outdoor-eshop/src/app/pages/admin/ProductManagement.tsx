"use client";

import { useState, type FormEvent } from "react";
import type { AdminCategory } from "@/features/products/domain/CategoryManagement";
import type { AdminProduct } from "@/features/products/domain/AdminProducts";
import { ProductInventory } from "./ProductInventory";
import styles from "./admin.module.css";

const emptyForm = {
  name: "",
  slug: "",
  brand: "",
  description: "",
  categoryId: "",
  audience: "unisex",
};

function productForm(product: AdminProduct) {
  return {
    name: product.name,
    slug: product.slug,
    brand: product.brand,
    description: product.description ?? "",
    categoryId: product.categoryId === null ? "" : String(product.categoryId),
    audience: product.audience,
  };
}

export function ProductManagement({
  initialProducts,
  categories,
}: {
  initialProducts: AdminProduct[];
  categories: AdminCategory[];
}) {
  const [products, setProducts] = useState(initialProducts);
  const [view, setView] = useState<"list" | "create" | "edit">("list");
  const [editing, setEditing] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);
  const [needsRefresh, setNeedsRefresh] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [inventoryBlocked, setInventoryBlocked] = useState(false);
  const [inventoryDirty, setInventoryDirty] = useState(false);

  async function load() {
    const response = await fetch("/api/admin/products", { cache: "no-store" });
    if (!response.ok) throw new Error("Zoznam produktov sa nepodarilo obnoviť.");
    const result: unknown = await response.json();
    if (!result || typeof result !== "object" || !("data" in result) || !Array.isArray(result.data) ||
      !result.data.every((item: unknown) =>
        item !== null && typeof item === "object" &&
        "id" in item && typeof item.id === "number" &&
        "name" in item && typeof item.name === "string" &&
        "slug" in item && typeof item.slug === "string" &&
        "brand" in item && typeof item.brand === "string" &&
        "description" in item && (typeof item.description === "string" || item.description === null) &&
        "categoryId" in item && (typeof item.categoryId === "number" || item.categoryId === null) &&
        "audience" in item && (item.audience === "men" || item.audience === "women" || item.audience === "unisex") &&
        "isActive" in item && typeof item.isActive === "boolean" &&
        "variantCount" in item && typeof item.variantCount === "number" &&
        "activeVariantCount" in item && typeof item.activeVariantCount === "number" &&
        "skus" in item && Array.isArray(item.skus) && item.skus.every((sku: unknown) => typeof sku === "string"))) {
      throw new Error("Server vrátil neplatný zoznam produktov.");
    }
    setProducts(result.data);
    return result.data;
  }

  async function refresh() {
    setBusy(true);
    try {
      await load();
      setNeedsRefresh(false);
      setMessage("Zoznam bol obnovený. Skontrolujte poslednú zmenu.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Zoznam sa nepodarilo obnoviť.");
    } finally {
      setBusy(false);
    }
  }

  async function mutate(path: string, method: string, body: object) {
    if (busy || needsRefresh) return;
    setBusy(true);
    setMessage(null);
    let response: Response;
    try {
      response = await fetch(path, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch {
      setNeedsRefresh(true);
      setMessage("Výsledok zmeny nie je známy. Obnovte zoznam.");
      setBusy(false);
      return;
    }
    try {
      if (!response.ok) {
        if (response.status >= 500) setNeedsRefresh(true);
        const result = await response.json();
        throw new Error(typeof result.error === "string" ? result.error : "Produkt sa nepodarilo upraviť.");
      }
      setNeedsRefresh(true);
      const payload: unknown = await response.json();
      if (!payload || typeof payload !== "object" || !("data" in payload) ||
        !payload.data || typeof payload.data !== "object" ||
        !("success" in payload.data) || payload.data.success !== true ||
        (method === "POST" && (!("id" in payload.data) || typeof payload.data.id !== "number"))) {
        throw new Error("Výsledok zmeny nie je známy. Obnovte zoznam.");
      }
      const updated = await load();
      if (method === "POST" && "id" in payload.data) {
        const createdId = payload.data.id;
        const created = updated.find((product) => product.id === createdId);
        if (!created) throw new Error("Nový produkt sa nenašiel v obnovenom zozname.");
        edit(created);
      }
      setNeedsRefresh(false);
      setMessage("Produkt bol uložený.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Zoznam sa nepodarilo obnoviť.");
    } finally {
      setBusy(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void mutate(editing === null ? "/api/admin/products" : `/api/admin/products/${editing}`,
      editing === null ? "POST" : "PUT",
      { ...form, categoryId: form.categoryId ? Number(form.categoryId) : null });
  }

  function edit(product: AdminProduct) {
    setEditing(product.id);
    setInventoryBlocked(true);
    setInventoryDirty(false);
    setView("edit");
    setForm(productForm(product));
    setMessage(null);
  }

  function showProducts() {
    const savedForm = selectedProduct ? productForm(selectedProduct) : emptyForm;
    const formDirty = Object.keys(emptyForm).some((key) => {
      const field = key as keyof typeof emptyForm;
      return form[field] !== savedForm[field];
    });
    if ((formDirty || inventoryDirty) &&
      !window.confirm("Neuložené zmeny sa zahodia. Chcete sa vrátiť na zoznam produktov?")) {
      return;
    }
    setView("list");
    setEditing(null);
    setForm(emptyForm);
    setInventoryBlocked(false);
    setInventoryDirty(false);
    setMessage(null);
  }

  function createProduct() {
    setView("create");
    setEditing(null);
    setForm(emptyForm);
    setMessage(null);
  }

  const selectedProduct = products.find((product) => product.id === editing);
  const search = query.trim().toLocaleLowerCase("sk");
  const filteredProducts = products.filter((product) =>
    (status === "all" || product.isActive === (status === "active")) &&
    [product.name, ...product.skus].some((value) => value.toLocaleLowerCase("sk").includes(search)),
  );

  return (
    <section className={styles.categories}>
      <h2>Správa produktov</h2>
      <p>Deaktivácia skryje produkt z katalógu a zachová jeho objednávky.</p>
      {message && <p role="status">{message}</p>}
      {needsRefresh && (
        <button type="button" disabled={busy} onClick={() => void refresh()}>
          Obnoviť zoznam
        </button>
      )}
      {view !== "list" && (
        <div className={styles.actions}>
          <button type="button" disabled={busy || needsRefresh || inventoryBlocked} onClick={showProducts}>
            Späť na produkty
          </button>
        </div>
      )}
      {view !== "list" && (
        <form className={styles.form} onSubmit={submit}>
          <h3>{view === "create" ? "Nový produkt" : `Upraviť produkt: ${selectedProduct?.name ?? form.name}`}</h3>
          <label>Názov produktu
            <input required maxLength={150} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} disabled={busy || needsRefresh} />
          </label>
          <label>Slug produktu
            <input required maxLength={180} pattern="[a-z0-9]+(-[a-z0-9]+)*" value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} disabled={busy || needsRefresh} />
          </label>
          <label>Značka
            <input required maxLength={100} value={form.brand} onChange={(event) => setForm({ ...form, brand: event.target.value })} disabled={busy || needsRefresh} />
          </label>
          <label>Opis
            <textarea maxLength={5000} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} disabled={busy || needsRefresh} />
          </label>
          <label>Kategória
            <select value={form.categoryId} onChange={(event) => setForm({ ...form, categoryId: event.target.value })} disabled={busy || needsRefresh}>
              <option value="">Bez kategórie</option>
              {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
          </label>
          <label>Určenie
            <select value={form.audience} onChange={(event) => setForm({ ...form, audience: event.target.value })} disabled={busy || needsRefresh}>
              <option value="unisex">Unisex</option>
              <option value="men">Muži</option>
              <option value="women">Ženy</option>
            </select>
          </label>
          <div className={styles.actions}>
            <button type="submit" disabled={busy || needsRefresh}>Uložiť produkt</button>
          </div>
        </form>
      )}
      {view === "edit" && selectedProduct?.activeVariantCount === 0 && (
        <p>Produkt nemá aktívny variant a nezobrazí sa v katalógu.</p>
      )}
      {view === "edit" && selectedProduct && (
        <ProductInventory
          key={selectedProduct.id}
          productId={selectedProduct.id}
          productName={selectedProduct.name}
          onChanged={async () => { await load(); }}
          onBlockedChange={setInventoryBlocked}
          onDirtyChange={setInventoryDirty}
        />
      )}
      {view === "list" && (
        <>
          <div className={styles.actions}>
            <button type="button" disabled={busy || needsRefresh} onClick={createProduct}>
              Pridať produkt
            </button>
          </div>
          <div className={styles.form}>
            <label>
              Hľadať produkt podľa názvu alebo SKU
              <input value={query} onChange={(event) => setQuery(event.target.value)} />
            </label>
            <label>
              Stav produktu
              <select value={status} onChange={(event) => setStatus(event.target.value)}>
                <option value="all">Všetky</option>
                <option value="active">Aktívne</option>
                <option value="inactive">Deaktivované</option>
              </select>
            </label>
          </div>
          {filteredProducts.length === 0 && <p>Žiadne produkty nezodpovedajú výberu.</p>}
          <ul className={styles.categoryList}>
            {filteredProducts.map((product) => (
              <li key={product.id} className={styles.categoryItem}>
                <div>
                  <strong>{product.name}</strong>
                  <p>{product.slug} · {product.isActive ? "Aktívny" : "Deaktivovaný"}</p>
                  <p>Varianty: {product.variantCount} · Aktívne: {product.activeVariantCount}</p>
                  {product.activeVariantCount === 0 && <p>Produkt nemá aktívny variant a nezobrazí sa v katalógu.</p>}
                </div>
                <div className={styles.actions}>
                  <button type="button" disabled={busy || needsRefresh} onClick={() => edit(product)}>Upraviť</button>
                  <button
                    type="button"
                    disabled={busy || needsRefresh}
                    onClick={() => {
                      if (window.confirm(`${product.isActive ? "Deaktivovať" : "Aktivovať"} produkt ${product.name}?`)) {
                        void mutate(`/api/admin/products/${product.id}`, "PATCH", { active: !product.isActive });
                      }
                    }}
                  >
                    {product.isActive ? "Deaktivovať" : "Aktivovať"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
