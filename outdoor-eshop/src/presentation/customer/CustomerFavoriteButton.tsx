"use client";

import { useEffect, useState } from "react";
import { FavoriteButton } from "@/components/FavoriteButton/FavoriteButton";
import { customerFavorites } from "@/composition/client/customerFavorites";
import styles from "./customer.module.css";

export function CustomerFavoriteButton({
  colorId,
  className,
}: {
  colorId: number;
  className?: string;
}) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function updateFavoriteState() {
      try {
        setIsFavorite(customerFavorites.getFavoriteColorIds().includes(colorId));
        setError(null);
      } catch {
        setError("Obľúbené položky sa nepodarilo načítať.");
      }
    }

    updateFavoriteState();
    return customerFavorites.subscribe(updateFavoriteState);
  }, [colorId]);

  function toggleFavorite() {
    try {
      customerFavorites.setFavoriteColor(colorId, !isFavorite);
      setError(null);
    } catch {
      setError("Obľúbené položky sa nepodarilo uložiť.");
    }
  }

  return (
    <>
      <FavoriteButton
        isFavorite={isFavorite}
        onToggle={toggleFavorite}
        className={className}
      />
      {error && <span className={styles.favoriteError} role="alert">{error}</span>}
    </>
  );
}
