import { isShippingMethodCode, type CheckoutDetails } from "@/features/checkout/domain/checkout";
import type { CreatedOrder } from "@/features/checkout/domain/OrderRepository";

export type ShippingOption = {
  code: CheckoutDetails["shippingMethod"];
  name: string;
  price: number;
};

export class OrderOutcomeUnknownError extends Error {
  constructor() {
    super("Stav objednávky nie je známy. Skontrolujte zákaznícky účet a pred ďalším odoslaním kontaktujte podporu.");
    this.name = "OrderOutcomeUnknownError";
  }
}

export async function fetchShippingOptions(): Promise<ShippingOption[]> {
  const response = await fetch("/api/checkout/shipping");
  if (!response.ok) throw new Error("Cenu dopravy sa nepodarilo načítať.");
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new Error("Odpoveď spôsobov dopravy nemá platný formát.");
  }
  if (
    typeof payload !== "object" || payload === null ||
    !("data" in payload) || typeof payload.data !== "object" || payload.data === null ||
    !("options" in payload.data) || !Array.isArray(payload.data.options)
  ) {
    throw new Error("Odpoveď spôsobov dopravy nemá platný formát.");
  }
  return payload.data.options.map((option: unknown) => {
    if (
      typeof option !== "object" || option === null ||
      !("code" in option) || !isShippingMethodCode(option.code) ||
      !("name" in option) || typeof option.name !== "string" ||
      !("price" in option) || typeof option.price !== "number"
    ) {
      throw new Error("Odpoveď spôsobov dopravy nemá platný formát.");
    }
    return { code: option.code, name: option.name, price: option.price };
  });
}

export async function submitOrder(details: CheckoutDetails): Promise<CreatedOrder> {
  let response: Response;
  try {
    response = await fetch("/api/orders", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...details, paymentMethod: "cod" }),
    });
  } catch {
    throw new OrderOutcomeUnknownError();
  }
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new OrderOutcomeUnknownError();
  }
  if (!response.ok) {
    if (response.status >= 500) throw new OrderOutcomeUnknownError();
    const message = typeof payload === "object" && payload !== null &&
      "error" in payload && typeof payload.error === "string"
      ? payload.error
      : "Objednávku sa nepodarilo vytvoriť.";
    throw new Error(message);
  }
  if (
    typeof payload !== "object" || payload === null ||
    !("data" in payload) || typeof payload.data !== "object" || payload.data === null ||
    !("orderNumber" in payload.data) || typeof payload.data.orderNumber !== "string" ||
    !("totalPrice" in payload.data) || typeof payload.data.totalPrice !== "number"
  ) {
    throw new OrderOutcomeUnknownError();
  }
  return { orderNumber: payload.data.orderNumber, totalPrice: payload.data.totalPrice };
}
