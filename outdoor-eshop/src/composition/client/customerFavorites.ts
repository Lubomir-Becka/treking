"use client";

import { createFavoriteColorUseCases } from "@/application/customer/FavoriteColors";
import { localStorageFavoriteColorRepository } from "@/infrastructure/customer/favorites";

export const customerFavorites = createFavoriteColorUseCases(
  localStorageFavoriteColorRepository,
);
