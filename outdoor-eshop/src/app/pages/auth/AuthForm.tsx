"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { authenticate } from "@/features/session/composition/client";
import { isValidPassword, validateRegistration } from "@/shared/domain/contactValidation";
import { isValidCustomerEmail } from "@/shared/domain/email";
import styles from "./auth.module.css";

type AuthFormProps = {
  mode: "login" | "register";
  nextPath?: string;
  loginOnly?: boolean;
};

export function AuthForm({ mode, nextPath = "/account", loginOnly = false }: AuthFormProps) {
  const router = useRouter();
  const [activeMode, setActiveMode] = useState(mode);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const isLogin = loginOnly || activeMode === "login";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());

    try {
      if (isLogin && (!isValidCustomerEmail(String(payload.email ?? "")) ||
        !isValidPassword(String(payload.password ?? "")))) {
        setError("Skontrolujte e-mail a heslo (8 znakov až 72 bajtov).");
        return;
      }
      const registrationError = !isLogin ? validateRegistration({
        firstName: String(payload.firstName ?? ""),
        lastName: String(payload.lastName ?? ""),
        email: String(payload.email ?? ""),
        password: String(payload.password ?? ""),
        phone: String(payload.phone ?? ""),
      }) : null;
      if (registrationError) {
        setError(registrationError);
        return;
      }
      const role = await authenticate(loginOnly ? "admin-login" : isLogin ? "login" : "register", payload);
      if (role === "customer") {
        window.dispatchEvent(new CustomEvent("vertex-cart-updated"));
      }
      router.push(role === "admin" ? "/admin" : nextPath);
      router.refresh();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Požiadavku sa nepodarilo dokončiť.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <main className={styles.authPage}>
      <span className={styles.kicker}>VERTEX Tatran</span>
      <h1>{loginOnly ? "Prihlásenie do administrácie" : "Váš účet"}</h1>
      {!loginOnly && (
        <div className={styles.authModes} role="group" aria-label="Spôsob prístupu">
          <button
            type="button"
            disabled={pending}
            className={isLogin ? styles.authModeActive : ""}
            aria-pressed={isLogin}
            onClick={() => {
              setActiveMode("login");
              setError(null);
            }}
          >
            Prihlásenie
          </button>
          <button
            type="button"
            disabled={pending}
            className={!isLogin ? styles.authModeActive : ""}
            aria-pressed={!isLogin}
            onClick={() => {
              setActiveMode("register");
              setError(null);
            }}
          >
            Registrácia
          </button>
        </div>
      )}
      <form className={styles.authForm} onSubmit={submit}>
        {!isLogin && (
          <>
            <label>
              Meno
              <input name="firstName" required maxLength={50} autoComplete="given-name" />
            </label>
            <label>
              Priezvisko
              <input name="lastName" required maxLength={50} autoComplete="family-name" />
            </label>
          </>
        )}
        <label>
          E-mail
          <input name="email" type="email" required maxLength={100} autoComplete="email" />
        </label>
        <label>
          Heslo
          <input
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete={isLogin ? "current-password" : "new-password"}
          />
        </label>
        {!isLogin && (
          <label>
            Telefón (voliteľné)
            <input name="phone" type="tel" maxLength={20} autoComplete="tel" />
          </label>
        )}
        {error && <p role="alert">{error}</p>}
        <button type="submit" disabled={pending}>
          {pending ? "Spracovanie..." : isLogin ? "Prihlásiť sa" : "Registrovať sa"}
        </button>
      </form>
    </main>
  );
}
