"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { CustomerProfile } from "@/features/customer/domain/CustomerAccountRepository";
import { updateProfile } from "@/features/customer/composition/client";
import styles from "./account.module.css";

type Props = {
  user: Pick<CustomerProfile, "email" | "firstName" | "lastName">;
};

export function ProfileSettings({ user }: Props) {
  const router = useRouter();
  const [firstName, setFirstName] = useState(user.firstName);
  const [lastName, setLastName] = useState(user.lastName);
  const [email, setEmail] = useState(user.email);
  const [currentPassword, setCurrentPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const emailChanged = email.trim().toLowerCase() !== user.email.toLowerCase();

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaved(false);

    if (emailChanged && !currentPassword) {
      setError("Na zmenu e-mailu zadajte svoje aktuálne heslo.");
      return;
    }

    setIsSaving(true);
    try {
      const data = await updateProfile({
        firstName,
        lastName,
        ...(emailChanged ? { email: email.trim(), currentPassword } : {}),
      });

      setFirstName(data.firstName);
      setLastName(data.lastName);
      setEmail(data.email);
      setCurrentPassword("");
      setSaved(true);
      router.refresh();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Profil sa nepodarilo aktualizovať.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <article className={styles.dashboardCard}>
      <span className={styles.kicker}>Osobné údaje</span>
      <h2>Nastavenia profilu</h2>
      <form className={styles.profileForm} onSubmit={saveProfile}>
        <label>
          Meno
          <input
            autoComplete="given-name"
            maxLength={50}
            required
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
          />
        </label>
        <label>
          Priezvisko
          <input
            autoComplete="family-name"
            maxLength={50}
            required
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
          />
        </label>
        <label>
          E-mail
          <input
            autoComplete="email"
            maxLength={100}
            required
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        {emailChanged && (
          <label>
            Aktuálne heslo
            <input
              autoComplete="current-password"
              required
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
            />
          </label>
        )}
        {emailChanged && (
          <p className={styles.profileHint}>
            Na potvrdenie zmeny e-mailu zadajte svoje aktuálne heslo.
          </p>
        )}
        {error && <p className={styles.profileError} role="alert">{error}</p>}
        {saved && <p className={styles.profileSuccess} role="status">Údaje profilu boli uložené.</p>}
        <button className={styles.primaryButton} disabled={isSaving} type="submit">
          {isSaving ? "Ukladám…" : "Uložiť zmeny"}
        </button>
      </form>
    </article>
  );
}
