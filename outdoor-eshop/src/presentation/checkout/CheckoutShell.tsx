"use client";

import { useEffect, useState } from "react";
import { Footer } from "@/components/Footer/Footer";
import { Header } from "@/components/Header/Header";
import type { CartItem } from "@/domain/cart/Cart";
import {
  type CheckoutDetails,
  type CheckoutRouteStep,
  type CheckoutStep,
} from "../../domain/checkout/checkout";
import { fetchCart } from "@/presentation/cart/client";
import {
  CartStep,
  CheckoutStepper,
  ConfirmationStep,
  PaymentStep,
  parseShippingOptions,
  ShippingStep,
  type CreatedOrder,
  type ShippingOption,
} from "./CheckoutStepComponents";
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
    shippingMethod: "packeta",
  });

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
    let active = true;
    setShippingError(null);
    fetch("/api/checkout/shipping")
      .then(async (response) => {
        let payload: unknown;
        try {
          payload = await response.json();
        } catch {
          throw new Error("Odpoveď spôsobov dopravy nemá platný formát.");
        }
        if (
          typeof payload !== "object" ||
          payload === null ||
          !("data" in payload) ||
          typeof payload.data !== "object" ||
          payload.data === null ||
          !("options" in payload.data)
        ) {
          throw new Error("Odpoveď spôsobov dopravy nemá platný formát.");
        }
        const options = parseShippingOptions(payload.data.options);
        if (!options) {
          throw new Error("Odpoveď spôsobov dopravy nemá platný formát.");
        }
        if (!response.ok) {
          throw new Error("Cenu dopravy sa nepodarilo načítať.");
        }
        return options;
      })
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
  }, [items]);

  let content;
  if (step === "confirmation") {
    content = <ConfirmationStep order={createdOrder} />;
  } else if (step === "shipping") {
    content = (
      <ShippingStep
        items={items}
        details={details}
        shippingOptions={shippingOptions}
        shippingError={shippingError}
        onContinue={setDetails}
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
        onOrderCreated={setCreatedOrder}
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
