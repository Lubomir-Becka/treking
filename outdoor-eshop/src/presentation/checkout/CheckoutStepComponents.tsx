"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Dispatch, FormEvent, SetStateAction } from "react";
import type { CartItem } from "@/domain/cart/Cart";
import {
  checkoutSteps,
  isShippingMethodCode,
  type CheckoutDetails,
  type CheckoutStep,
} from "../../domain/checkout/checkout";
import { removeCartItem, updateCartItem } from "@/presentation/cart/client";
import styles from "./Checkout.module.css";

export type ShippingOption = {
  code: CheckoutDetails["shippingMethod"];
  name: string;
  price: number;
};

export type CreatedOrder = {
  orderNumber: string;
  totalPrice: number;
};

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

function formatPrice(value: number) {
  return value.toLocaleString("sk-SK", {
    style: "currency",
    currency: "EUR",
  });
}

export function parseShippingOptions(value: unknown): ShippingOption[] | null {
  if (!Array.isArray(value)) return null;
  const options: ShippingOption[] = [];
  for (const option of value) {
    if (
      typeof option !== "object" ||
      option === null ||
      !("code" in option) ||
      !isShippingMethodCode(option.code) ||
      !("name" in option) ||
      typeof option.name !== "string" ||
      !("price" in option) ||
      typeof option.price !== "number"
    ) {
      return null;
    }
    options.push({
      code: option.code,
      name: option.name,
      price: option.price,
    });
  }
  return options;
}

export function CheckoutStepper({ currentStep }: { currentStep: CheckoutStep }) {
  return (
    <nav className={styles.checkoutStepper} aria-label="Postup objednávky">
      {checkoutSteps.map((step, index) => (
        <div key={step.number} className={styles.checkoutStepGroup}>
          {step.number <= currentStep ? (
            <Link
              className={`${styles.checkoutStep} ${
                currentStep === step.number
                  ? styles.checkoutStepActive
                  : styles.checkoutStepCompleted
              }`}
              href={step.href}
              aria-current={currentStep === step.number ? "step" : undefined}
            >
              <span className={styles.checkoutStepNumber}>
                {currentStep > step.number ? "✓" : step.number}
              </span>
              <span>{step.label}</span>
            </Link>
          ) : (
            <span className={styles.checkoutStep} aria-disabled="true">
              <span className={styles.checkoutStepNumber}>{step.number}</span>
              <span>{step.label}</span>
            </span>
          )}
          {index < checkoutSteps.length - 1 && (
            <span className={styles.checkoutStepLine} aria-hidden="true" />
          )}
        </div>
      ))}
    </nav>
  );
}

function OrderSummary({
  items,
  shippingCost,
}: {
  items: CartItem[];
  shippingCost?: number | null;
}) {
  const subtotal = items.reduce(
    (total, item) => total + item.unitPrice * item.quantity,
    0,
  );
  const total = subtotal + (shippingCost ?? 0);

  return (
    <aside className={styles.checkoutSummary}>
      <h2>Zhrnutie objednávky</h2>
      <div className={styles.checkoutSummaryRows}>
        <div className={styles.checkoutSummaryRow}>
          <span>Medzisúčet tovaru</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        <div className={styles.checkoutSummaryRow}>
          <span>Doprava</span>
          <span>
            {shippingCost === undefined
              ? "V ďalšom kroku"
              : shippingCost === null
                ? "Nedostupná"
                : shippingCost === 0
                  ? "ZADARMO"
                  : formatPrice(shippingCost)}
          </span>
        </div>
      </div>
      <div className={styles.checkoutTotal}>
        <span>Spolu s DPH</span>
        <strong>{formatPrice(total)}</strong>
      </div>
    </aside>
  );
}

export function CartStep({
  items,
  setItems,
  isLoading,
  loadError,
  onRetry,
}: {
  items: CartItem[];
  setItems: Dispatch<SetStateAction<CartItem[]>>;
  isLoading: boolean;
  loadError: string | null;
  onRetry: () => void;
}) {
  const router = useRouter();
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updatingItemId, setUpdatingItemId] = useState<number | null>(null);

  async function updateQuantity(item: CartItem, change: number) {
    if (!item.id) return;
    const quantity = item.quantity + change;
    setUpdateError(null);
    setUpdatingItemId(item.id);
    try {
      const cart = quantity > 0
        ? await updateCartItem(item.id, quantity)
        : await removeCartItem(item.id);
      setItems(cart.items);
    } catch {
      setUpdateError("Zmenu košíka sa nepodarilo uložiť. Skúste to znova.");
    } finally {
      setUpdatingItemId(null);
    }
  }

  function continueToShipping() {
    if (items.length > 0) router.push("/checkout/shipping");
  }

  return (
    <>
      <div className={styles.checkoutTitle}>
        <span className={styles.checkoutEyebrow}>Krok 1 z 3 · Prehľad</span>
        <h1>Košík & objednávka</h1>
      </div>
      {loadError ? (
        <div className={styles.checkoutEmpty} role="alert">
          <p>{loadError}</p>
          <button type="button" onClick={onRetry}>Skúsiť znova</button>
        </div>
      ) : isLoading ? (
        <div className={styles.checkoutEmpty} role="status">
          <p>Načítavame košík…</p>
        </div>
      ) : items.length === 0 ? (
        <div className={styles.checkoutEmpty}>
          <p>Košík je zatiaľ prázdny.</p>
          <Link className={styles.checkoutBack} href="/search">
            Späť do katalógu
          </Link>
        </div>
      ) : (
        <div className={styles.checkoutLayout}>
          <section className={styles.checkoutPanel}>
            <h2>Výstroj v košíku</h2>
            {updateError && <p role="alert">{updateError}</p>}
            {items.map((item) => (
              <article className={styles.checkoutCartItem} key={item.variantId}>
                <div className={styles.checkoutProductImage}>
                  {item.imageUrl && <img src={item.imageUrl} alt="" />}
                </div>
                <div className={styles.checkoutProductMeta}>
                  <h3>{item.productName}</h3>
                  <div className={styles.checkoutProductOptions}>
                    <span className={styles.checkoutProductOption}>
                      <small>Farba</small>
                      <strong>{item.colorName ?? "Neuvedená"}</strong>
                    </span>
                    <span className={styles.checkoutProductOption}>
                      <small>Veľkosť</small>
                      <strong>{item.size ?? "Neuvedená"}</strong>
                    </span>
                  </div>
                  <p>● Skladom v Tatranskej Lomnici</p>
                  <div className={styles.checkoutQuantity}>
                    <button
                      type="button"
                      disabled={updatingItemId === item.id}
                      onClick={() => updateQuantity(item, -1)}
                      aria-label={`Znížiť množstvo produktu ${item.productName}`}
                    >
                      −
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      type="button"
                      disabled={updatingItemId === item.id}
                      onClick={() => updateQuantity(item, 1)}
                      aria-label={`Zvýšiť množstvo produktu ${item.productName}`}
                    >
                      +
                    </button>
                  </div>
                  <button
                    className={styles.checkoutRemove}
                    type="button"
                    disabled={updatingItemId === item.id}
                    onClick={() => updateQuantity(item, -item.quantity)}
                  >
                    Odstrániť z košíka
                  </button>
                </div>
                <strong className={styles.checkoutProductPrice}>
                  {formatPrice(item.unitPrice * item.quantity)}
                </strong>
              </article>
            ))}
            <Link className={styles.checkoutBack} href="/search">
              ← Pokračovať v nákupe výbavy
            </Link>
          </section>
          <div>
            <OrderSummary items={items} />
            <button
              className={styles.checkoutButton}
              type="button"
              onClick={continueToShipping}
            >
              Pokračovať na dopravu →
            </button>
          </div>
        </div>
      )}
      {items.length > 0 && (
        <div className={styles.checkoutMobileBar}>
          <strong>
            {formatPrice(items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0))}
          </strong>
          <button className={styles.checkoutButton} type="button" onClick={continueToShipping}>
            Doprava →
          </button>
        </div>
      )}
    </>
  );
}

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
  const shippingPrice = shippingOptions.find(
    (option) => option.code === form.shippingMethod,
  )?.price;

  function updateField(field: keyof CheckoutDetails, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function continueToPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onContinue(form);
    router.push("/checkout/payment");
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
              <div className={styles.checkoutFieldFull}>
                <label htmlFor="note">Poznámka pre expedičný tím</label>
                <textarea
                  id="note"
                  rows={3}
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
        </section>
        <OrderSummary items={items} shippingCost={shippingPrice ?? null} />
      </div>
    </>
  );
}

export function PaymentStep({
  items,
  details,
  shippingCost,
  shippingError,
  onOrderCreated,
}: {
  items: CartItem[];
  details: CheckoutDetails;
  shippingCost: number | null;
  shippingError: string | null;
  onOrderCreated: (order: CreatedOrder) => void;
}) {
  const router = useRouter();
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submitOrder() {
    setIsSubmitting(true);
    setOrderError(null);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...details, paymentMethod: "cod" }),
      });
      let payload: unknown;
      try {
        payload = await response.json();
      } catch {
        setOrderError("Objednávku sa nepodarilo potvrdiť. Skúste to znova.");
        return;
      }
      const order =
        typeof payload === "object" &&
        payload !== null &&
        "data" in payload &&
        typeof payload.data === "object" &&
        payload.data !== null &&
        "orderNumber" in payload.data &&
        typeof payload.data.orderNumber === "string" &&
        "totalPrice" in payload.data &&
        typeof payload.data.totalPrice === "number"
          ? {
              orderNumber: payload.data.orderNumber,
              totalPrice: payload.data.totalPrice,
            }
          : null;
      if (!response.ok) {
        const message =
          typeof payload === "object" &&
          payload !== null &&
          "error" in payload &&
          typeof payload.error === "string"
            ? payload.error
            : "Objednávku sa nepodarilo vytvoriť.";
        setOrderError(message);
        return;
      }
      if (!order) {
        setOrderError("Objednávku sa nepodarilo potvrdiť. Skúste to znova.");
        return;
      }
      onOrderCreated(order);
      router.push("/checkout/confirmation");
    } catch {
      setOrderError("Objednávku sa nepodarilo vytvoriť. Skúste to znova.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <div className={styles.checkoutTitle}>
        <span className={styles.checkoutEyebrow}>Krok 3 z 3 · Dokončenie</span>
        <h1>Potvrdenie objednávky</h1>
      </div>
      <div className={styles.checkoutLayout}>
        <section>
          <div className={styles.checkoutPanel}>
            <h2>Platba pri prevzatí</h2>
            <p>Objednávku zaplatíte pri prevzatí. Online platba zatiaľ nie je dostupná.</p>
          </div>
          {shippingError && <p role="alert">{shippingError}</p>}
          <div className={styles.checkoutPanel}>
            <h2>Potvrdenie objednávky</h2>
            <label>
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(event) => setTermsAccepted(event.target.checked)}
              />{" "}
              Súhlasím s obchodnými podmienkami a spracovaním osobných údajov.
            </label>
          </div>
          <button
            className={styles.checkoutButton}
            type="button"
            disabled={!termsAccepted || isSubmitting || shippingCost === null}
            onClick={submitOrder}
          >
            Záväzne objednať s platbou pri prevzatí
          </button>
          {orderError && <p role="alert">{orderError}</p>}
        </section>
        <OrderSummary items={items} shippingCost={shippingCost} />
      </div>
    </>
  );
}

export function ConfirmationStep({ order }: { order: CreatedOrder | null }) {
  return (
    <div className={styles.checkoutEmpty}>
      {order ? (
        <>
          <span className={styles.checkoutEyebrow}>Objednávka prijatá</span>
          <h1>Ďakujeme za objednávku.</h1>
          <p>Číslo objednávky: {order.orderNumber}</p>
          <p>Zaplatíte pri prevzatí. Online platba ani e-mailové potvrdenie nie sú dostupné.</p>
          <strong>{formatPrice(order.totalPrice)}</strong>
        </>
      ) : (
        <>
          <span className={styles.checkoutEyebrow}>Objednávku sa nepodarilo overiť</span>
          <h1>Skontrolujte stav objednávky.</h1>
          <p>Ak ste objednávku už odoslali, nájdete ju vo svojom zákazníckom účte.</p>
        </>
      )}
      <Link className={styles.checkoutBack} href="/">
        Späť na domovskú stránku
      </Link>
    </div>
  );
}
