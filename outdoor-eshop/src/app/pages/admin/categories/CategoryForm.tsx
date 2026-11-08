"use client";

import { useState, type FormEvent } from "react";
import {
  validateCategoryInput,
  type AdminCategory,
  type CategoryInput,
} from "@/features/products/domain/CategoryManagement";
import styles from "../admin.module.css";

type Props = {
  categories: AdminCategory[];
  editing: AdminCategory | null;
  disabled: boolean;
  onSave: (input: CategoryInput) => Promise<void>;
  onCancel: () => void;
};

export function CategoryForm({ categories, editing, disabled, onSave, onCancel }: Props) {
  const [name, setName] = useState(editing?.name ?? "");
  const [slug, setSlug] = useState(editing?.slug ?? "");
  const [parentId, setParentId] = useState(editing?.parentId?.toString() ?? "");
  const [error, setError] = useState<string | null>(null);
  const parents = categories.filter((category) =>
    category.parentId === null && category.id !== editing?.id
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = { name, slug, parentId: parentId ? Number(parentId) : null };
    const validationError = validateCategoryInput(input);
    setError(validationError);
    if (!validationError) await onSave(input);
  }

  return (
    <form className={styles.form} onSubmit={submit}>
      <h3>{editing ? "Upraviť kategóriu" : "Nová kategória"}</h3>
      {error && <p role="alert">{error}</p>}
      <label>
        Názov
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={100}
          disabled={disabled}
          required
        />
      </label>
      <label>
        Slug
        <input
          value={slug}
          onChange={(event) => setSlug(event.target.value)}
          maxLength={120}
          disabled={disabled}
          required
        />
      </label>
      <label>
        Nadradená kategória
        <select
          value={parentId}
          onChange={(event) => setParentId(event.target.value)}
          disabled={disabled || Boolean(editing?.childCount)}
        >
          <option value="">Žiadna — hlavná kategória</option>
          {parents.map((parent) => (
            <option key={parent.id} value={parent.id}>
              {parent.name}
            </option>
          ))}
        </select>
      </label>
      {Boolean(editing?.childCount) && (
        <p>Kategória s podkategóriami musí zostať hlavná.</p>
      )}
      <div className={styles.actions}>
        <button type="submit" disabled={disabled}>
          Uložiť
        </button>
        {editing && (
          <button type="button" disabled={disabled} onClick={onCancel}>
            Zrušiť úpravu
          </button>
        )}
      </div>
    </form>
  );
}
