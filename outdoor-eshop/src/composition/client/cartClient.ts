"use client";

import { createCartClientUseCases } from "@/application/cart/CartClientUseCases";
import * as cartApi from "@/infrastructure/cart/CartApiClient";

const cartClient = createCartClientUseCases(cartApi);

export const {
  addItemToCart,
  fetchCart,
  removeCartItem,
  updateCartItem,
} = cartClient;
