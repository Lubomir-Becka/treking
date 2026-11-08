"use client";

import { createFavoriteColorUseCases } from "@/features/customer/application/FavoriteColors";
import { localStorageFavoriteColorRepository } from "@/features/customer/infrastructure/favorites";

export const customerFavorites = createFavoriteColorUseCases(
  localStorageFavoriteColorRepository,
);
