"use client";

import Image from "next/image";
import styles from "./favorite-button.module.css";

type Props = {
  isFavorite: boolean;
  onToggle: () => void;
  className?: string;
  disabled?: boolean;
};

export function FavoriteButton({ isFavorite, onToggle, className = "", disabled = false }: Props) {
  return (
    <button
      className={`${styles.button} ${isFavorite ? styles.active : ""} ${className}`}
      type="button"
      disabled={disabled}
      aria-label={isFavorite ? "Odobrať z obľúbených" : "Pridať medzi obľúbené"}
      aria-pressed={isFavorite}
      title={isFavorite ? "Odobrať z obľúbených" : "Pridať medzi obľúbené"}
      onClick={onToggle}
    >
      <Image
        src="/img/ui/heart.svg"
        alt=""
        aria-hidden="true"
        width={20}
        height={20}
      />
    </button>
  );
}
