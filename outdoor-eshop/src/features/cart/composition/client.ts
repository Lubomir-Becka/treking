"use client";

import { createCartClientUseCases } from "@/features/cart/application/CartClientUseCases";
import * as cartApi from "@/features/cart/infrastructure/CartApiClient";

const cartClient = createCartClientUseCases(cartApi);

export const {
  addItemToCart,
  fetchCart,
  removeCartItem,
  updateCartItem,
} = cartClient;
