"use client";

import { useEffect, useState } from "react";
import { Footer } from "@/app/_components/Footer/Footer";
import { Header } from "@/app/_components/Header/Header";
import type { CartItem } from "@/features/cart/domain/Cart";
import type { CheckoutDetails } from "@/features/checkout/domain/checkout";
import type { CheckoutRouteStep, CheckoutStep } from "./checkoutNavigation";
import { fetchCart } from "@/features/cart/composition/client";
import { isValidOrderDetails } from "@/features/checkout/domain/OrderValidation";
import { readCheckoutDetails, readCreatedOrder, writeCheckoutDetails, writeCreatedOrder } from "./checkoutStorage";
import Link from "next/link";
import { CartStep } from "./sections/CartStep";
import { CheckoutStepper } from "./sections/CheckoutStepper";
import { ConfirmationStep } from "./sections/ConfirmationStep";
import { PaymentStep } from "./sections/PaymentStep";
import { ShippingStep } from "./sections/ShippingStep";
import { fetchShippingOptions, type CreatedOrder, type ShippingOption } from "./client";
import styles from "./Checkout.module.css";

const checkoutStepNumbers: Record<CheckoutRouteStep, CheckoutStep> = {
  cart: 1,
  shipping: 2,
  payment: 3,
  confirmation: 4,
};

export default function CheckoutShell({ step }: { step: CheckoutRouteStep }) {
  const currentStep = checkoutStepNumbers[step];
  const [items, setItems] = useState<CartItem[]>([]);
  const [cartLoading, setCartLoading] = useState(true);
  const [cartError, setCartError] = useState<string | null>(null);
  const [cartRetryCount, setCartRetryCount] = useState(0);
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [shippingError, setShippingError] = useState<string | null>(null);
  const [createdOrder, setCreatedOrder] = useState<CreatedOrder | null>(null);
  const [storageReady, setStorageReady] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [details, setDetails] = useState<CheckoutDetails>({
    email: "",
    firstName: "",
    lastName: "",
    street: "",
    city: "",
    postalCode: "",
    phone: "",
    country: "SK",
    note: "",
    shippingMethod: "courier",
  });

  useEffect(() => {
    try {
      const savedDetails = readCheckoutDetails(sessionStorage);
      const savedOrder = readCreatedOrder(sessionStorage);
      if (savedDetails) setDetails(savedDetails);
      if (savedOrder) setCreatedOrder(savedOrder);
    } catch {
      setStorageError("Údaje objednávky sa nepodarilo obnoviť. Skontrolujte nastavenie úložiska prehliadača.");
    }
    setStorageReady(true);
  }, []);

  useEffect(() => {
    let active = true;
    setCartLoading(true);
    setCartError(null);
    fetchCart()
      .then((cart) => {
        if (active) setItems(cart.items);
      })
      .catch(() => {
        if (active) setCartError("Košík sa nepodarilo načítať.");
      })
      .finally(() => {
        if (active) setCartLoading(false);
      });
    return () => {
      active = false;
    };
  }, [cartRetryCount]);

  useEffect(() => {
    if (step !== "shipping" && step !== "payment") return;
    if (cartLoading || cartError) return;
    let active = true;
    setShippingOptions([]);
    setShippingError(null);
    fetchShippingOptions()
      .then((options) => {
        if (active) setShippingOptions(options);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setShippingOptions([]);
        setShippingError(
          error instanceof Error &&
          error.message === "Odpoveď spôsobov dopravy nemá platný formát."
            ? error.message
            : "Cenu dopravy sa nepodarilo načítať.",
        );
      });
    return () => {
      active = false;
    };
  }, [step, cartLoading, cartError, items]);

  let content;
  if (!storageReady) {
    content = <p role="status">Načítavame údaje objednávky…</p>;
  } else if (storageError) {
    content = <p role="alert">{storageError}</p>;
  } else if (step === "confirmation") {
    content = <ConfirmationStep order={createdOrder} />;
  } else if ((step === "shipping" || step === "payment") && cartError) {
    content = (
      <div role="alert">
        <p>{cartError}</p>
        <button type="button" onClick={() => setCartRetryCount((count) => count + 1)}>
          Skúsiť znova
        </button>
      </div>
    );
  } else if ((step === "shipping" || step === "payment") && cartLoading) {
    content = <p role="status">Načítavame košík…</p>;
  } else if (step === "payment" && !isValidOrderDetails(details)) {
    content = <p>Najprv vyplňte <Link href="/checkout/shipping">dodacie údaje</Link>.</p>;
  } else if (step === "shipping") {
    content = (
      <ShippingStep
        items={items}
        details={details}
        shippingOptions={shippingOptions}
        shippingError={shippingError}
        onContinue={(nextDetails) => {
          writeCheckoutDetails(sessionStorage, nextDetails);
          setDetails(nextDetails);
        }}
      />
    );
  } else if (step === "payment") {
    const shippingCost = shippingOptions.find(
      (option) => option.code === details.shippingMethod,
    )?.price ?? null;
    content = (
      <PaymentStep
        items={items}
        details={details}
        shippingCost={shippingCost}
        shippingError={shippingError}
        onOrderCreated={(order) => {
          setCreatedOrder(order);
          writeCreatedOrder(sessionStorage, order);
        }}
      />
    );
  } else {
    content = (
      <CartStep
        items={items}
        setItems={setItems}
        isLoading={cartLoading}
        loadError={cartError}
        onRetry={() => setCartRetryCount((count) => count + 1)}
      />
    );
  }

  return (
    <div className={styles.checkoutPage}>
      <Header />
      <CheckoutStepper currentStep={currentStep} />
      <main className={styles.checkoutContainer}>{content}</main>
      <Footer />
    </div>
  );
}
