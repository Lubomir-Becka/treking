"use client";

import { useState } from "react";
import type { AdminCategory, CategoryInput } from "@/features/products/domain/CategoryManagement";
import {
  CategoryMutationOutcomeUnknown,
  deleteAdminCategory,
  fetchAdminCategories,
  saveAdminCategory,
} from "@/features/products/composition/client";
import { CategoryForm } from "./CategoryForm";
import { CategoryList } from "./CategoryList";
import { runCategoryMutation } from "./categoryMutation";
import styles from "../admin.module.css";

export function CategoryManagement({
  categories,
  onCategoriesChange,
}: {
  categories: AdminCategory[];
  onCategoriesChange: (categories: AdminCategory[]) => void;
}) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formVersion, setFormVersion] = useState(0);
  const [busy, setBusy] = useState(false);
  const [needsRefresh, setNeedsRefresh] = useState(false);
  const [resetAfterRefresh, setResetAfterRefresh] = useState(false);
  const [verifyAfterRefresh, setVerifyAfterRefresh] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const editing = categories.find((category) => category.id === editingId) ?? null;

  async function refresh() {
    setBusy(true);
    setError(null);
    try {
      onCategoriesChange(await fetchAdminCategories());
      if (resetAfterRefresh) {
        setEditingId(null);
        setFormVersion((version) => version + 1);
        setResetAfterRefresh(false);
      }
      if (verifyAfterRefresh) {
        setNotice("Zoznam bol obnovený. Pred ďalšou zmenou overte, či sa predchádzajúca operácia vykonala.");
        setVerifyAfterRefresh(false);
      }
      setNeedsRefresh(false);
    } catch {
      setError("Zoznam kategórií sa nepodarilo obnoviť. Skúste to znova.");
    } finally {
      setBusy(false);
    }
  }

  async function mutate(
    action: () => Promise<void>,
    successMessage: string,
    resetForm: boolean,
  ) {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const result = await runCategoryMutation(action, fetchAdminCategories);
      if (resetForm) {
        setEditingId(null);
        setFormVersion((version) => version + 1);
      }
      setNotice(successMessage);
      if (result.status === "refresh-failed") {
        setNeedsRefresh(true);
        setError("Zmena sa uložila, ale zoznam sa nepodarilo obnoviť. Skúste to znova.");
      } else {
        onCategoriesChange(result.categories);
        setNeedsRefresh(false);
      }
    } catch (requestError) {
      if (requestError instanceof CategoryMutationOutcomeUnknown) {
        setNeedsRefresh(true);
        setResetAfterRefresh(resetForm);
        setVerifyAfterRefresh(true);
      }
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Operáciu s kategóriou sa nepodarilo vykonať.",
      );
    } finally {
      setBusy(false);
    }
  }

  function save(input: CategoryInput) {
    return mutate(
      () => saveAdminCategory(input, editing?.id),
      "Kategória bola uložená.",
      true,
    );
  }

  function remove(category: AdminCategory) {
    if (!window.confirm(`Naozaj chcete odstrániť kategóriu „${category.name}“?`)) {
      return;
    }
    void mutate(
      () => deleteAdminCategory(category.id),
      "Kategória bola odstránená.",
      editing?.id === category.id,
    );
  }

  return (
    <section className={styles.categories}>
      <h2>Správa kategórií</h2>
      <p>Kategóriu s produktmi alebo podkategóriami nemožno odstrániť.</p>
      {error && <p role="alert">{error}</p>}
      {notice && <p role="status">{notice}</p>}
      {needsRefresh && (
        <button type="button" disabled={busy} onClick={refresh}>
          Obnoviť zoznam
        </button>
      )}
      <CategoryForm
        key={`${editing?.id ?? "new"}-${formVersion}`}
        categories={categories}
        editing={editing}
        disabled={busy || needsRefresh}
        onSave={save}
        onCancel={() => setEditingId(null)}
      />
      <CategoryList
        categories={categories}
        disabled={busy || needsRefresh}
        onEdit={(category) => {
          setEditingId(category.id);
          setError(null);
          setNotice(null);
        }}
        onDelete={remove}
      />
    </section>
  );
}
