"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";
import type { CartItem } from "@/features/cart/domain/Cart";
import type { CheckoutDetails } from "@/features/checkout/domain/checkout";
import { validateOrderDetails } from "@/features/checkout/domain/OrderValidation";
import type { ShippingOption } from "../client";
import { formatPrice, OrderSummary } from "./OrderSummary";
import styles from "../Checkout.module.css";

const addressFields: Array<{
  label: string;
  type: string;
  autoComplete: string;
  field: keyof CheckoutDetails;
  maxLength: number;
}> = [
  { label: "E-mail", type: "email", autoComplete: "email", field: "email", maxLength: 100 },
  { label: "Telefónne číslo", type: "tel", autoComplete: "tel", field: "phone", maxLength: 20 },
  { label: "Meno", type: "text", autoComplete: "given-name", field: "firstName", maxLength: 100 },
  { label: "Priezvisko", type: "text", autoComplete: "family-name", field: "lastName", maxLength: 100 },
  { label: "Ulica a číslo domu", type: "text", autoComplete: "street-address", field: "street", maxLength: 150 },
  { label: "Mesto", type: "text", autoComplete: "address-level2", field: "city", maxLength: 100 },
  { label: "PSČ", type: "text", autoComplete: "postal-code", field: "postalCode", maxLength: 20 },
];

export function ShippingStep({
  items,
  details,
  shippingOptions,
  shippingError,
  onContinue,
}: {
  items: CartItem[];
  details: CheckoutDetails;
  shippingOptions: ShippingOption[];
  shippingError: string | null;
  onContinue: (details: CheckoutDetails) => void;
}) {
  const router = useRouter();
  const [form, setForm] = useState(details);
  const [saveError, setSaveError] = useState<string | null>(null);
  const shippingPrice = shippingOptions.find(
    (option) => option.code === form.shippingMethod,
  )?.price;

  function updateField(field: keyof CheckoutDetails, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function continueToPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationError = validateOrderDetails(form);
    if (validationError) {
      setSaveError(validationError);
      return;
    }
    setSaveError(null);
    try {
      onContinue(form);
      router.push("/checkout/payment");
    } catch {
      setSaveError("Dodacie údaje sa nepodarilo uložiť v prehliadači.");
    }
  }

  return (
    <>
      <div className={styles.checkoutTitle}>
        <span className={styles.checkoutEyebrow}>Krok 2 z 3 · Expedícia</span>
        <h1>Doprava & dodacie údaje</h1>
      </div>
      <div className={styles.checkoutLayout}>
        <section>
          <div className={styles.checkoutPanel}>
            <h2>Výber spôsobu doručenia</h2>
            {shippingError && <p role="alert">{shippingError}</p>}
            {!shippingError && shippingOptions.length === 0 && (
              <p>Momentálne nie sú dostupné spôsoby dopravy.</p>
            )}
            <div className={styles.checkoutOptions}>
              {shippingOptions.map((option) => (
                <label className={styles.checkoutOption} key={option.code}>
                  <input
                    type="radio"
                    name="shipping"
                    checked={form.shippingMethod === option.code}
                    onChange={() => updateField("shippingMethod", option.code)}
                  />
                  <strong>{option.name} · {option.price === 0 ? "ZADARMO" : formatPrice(option.price)}</strong>
                </label>
              ))}
            </div>
          </div>
          <div className={styles.checkoutPanel}>
            <h2>Dodacie a kontaktné údaje</h2>
            <form
              id="shipping-details"
              className={styles.checkoutForm}
              onSubmit={continueToPayment}
            >
              {addressFields.map(({ label, type, autoComplete, field, maxLength }, index) => (
                <div
                  className={`${styles.checkoutField} ${
                    index === 4 ? styles.checkoutFieldFull : ""
                  }`}
                  key={label}
                >
                  <label htmlFor={label}>{label}</label>
                  <input
                    id={label}
                    type={type}
                    autoComplete={autoComplete}
                    maxLength={maxLength}
                    value={form[field]}
                    onChange={(event) => updateField(field, event.target.value)}
                    required
                  />
                </div>
              ))}
              <div className={`${styles.checkoutField} ${styles.checkoutFieldFull}`}>
                <textarea
                  id="note"
                  aria-label="Poznámka pre expedičný tím"
                  placeholder="Poznámka pre expedičný tím (voliteľné)"
                  rows={3}
                  maxLength={2000}
                  value={form.note}
                  onChange={(event) => updateField("note", event.target.value)}
                />
              </div>
            </form>
          </div>
          <button
            className={styles.checkoutButton}
            type="submit"
            form="shipping-details"
            disabled={shippingPrice === undefined || shippingOptions.length === 0}
          >
            Pokračovať →
          </button>
          {saveError && <p role="alert">{saveError}</p>}
        </section>
        <OrderSummary items={items} shippingCost={shippingPrice ?? null} />
      </div>
    </>
  );
}
