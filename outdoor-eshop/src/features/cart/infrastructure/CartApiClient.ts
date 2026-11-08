import type { Cart } from "../domain/Cart";

type CartResponse = { data: Cart };

function isCartItem(value: unknown): value is Cart["items"][number] {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Record<string, unknown>;
  return (
    Number.isSafeInteger(item.id) &&
    Number.isSafeInteger(item.variantId) &&
    typeof item.productName === "string" &&
    typeof item.slug === "string" &&
    (typeof item.imageUrl === "string" || item.imageUrl === null) &&
    (typeof item.colorName === "string" || item.colorName === null) &&
    (typeof item.size === "string" || item.size === null) &&
    typeof item.sku === "string" &&
    typeof item.unitPrice === "number" &&
    typeof item.stock === "number" &&
    typeof item.quantity === "number"
  );
}

function isCartResponse(value: unknown): value is CartResponse {
  if (
    typeof value !== "object" ||
    value === null ||
    !("data" in value) ||
    typeof value.data !== "object" ||
    value.data === null ||
    !("id" in value.data) ||
    !Number.isSafeInteger(value.data.id) ||
    !("items" in value.data) ||
    !Array.isArray(value.data.items) ||
    !value.data.items.every(isCartItem)
  ) {
    return false;
  }
  return true;
}

export function parseCartResponse(value: unknown): CartResponse {
  if (!isCartResponse(value)) {
    throw new Error("Odpoveď košíka nemá platný formát.");
  }
  return value;
}

function notifyCartUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("vertex-cart-updated"));
  }
}

async function requestCart(input: RequestInfo, init?: RequestInit) {
  const response = await fetch(input, {
    ...init,
    headers: { "content-type": "application/json", ...init?.headers },
  });
  if (!response.ok) {
    let message = "Košík sa nepodarilo aktualizovať.";
    try {
      const body: unknown = await response.json();
      if (
        typeof body === "object" &&
        body !== null &&
        "error" in body &&
        typeof body.error === "string"
      ) {
        message = body.error;
      }
    } catch {
      // Use the standard cart error when the server does not return JSON.
    }
    throw new Error(message);
  }
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new Error("Odpoveď košíka nemá platný formát.");
  }
  return parseCartResponse(payload);
}

export async function fetchCart() {
  return (await requestCart("/api/cart")).data;
}

export async function addItemToCart(variantId: number, quantity = 1) {
  const cart = (await requestCart("/api/cart", {
    method: "POST",
    body: JSON.stringify({ variantId, quantity }),
  })).data;
  notifyCartUpdated();
  return cart;
}

export async function updateCartItem(itemId: number, quantity: number) {
  const cart = (await requestCart(`/api/cart/items/${itemId}`, {
    method: "PATCH",
    body: JSON.stringify({ quantity }),
  })).data;
  notifyCartUpdated();
  return cart;
}

export async function removeCartItem(itemId: number) {
  const cart = (await requestCart(`/api/cart/items/${itemId}`, { method: "DELETE" })).data;
  notifyCartUpdated();
  return cart;
}
