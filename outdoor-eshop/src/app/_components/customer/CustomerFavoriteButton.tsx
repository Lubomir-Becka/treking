"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FavoriteButton } from "@/app/_components/FavoriteButton/FavoriteButton";
import { useFavorites } from "./FavoritesProvider";
import styles from "./favorite-error.module.css";

export function CustomerFavoriteButton({ colorId, className }: { colorId: number; className?: string }) {
  const { authenticated, ids, busy, error, reload, toggle } = useFavorites();
  const router = useRouter();
  const pathname = usePathname();

  function onToggle() {
    if (!authenticated) {
      router.push(`/login?next=${encodeURIComponent(pathname + window.location.search)}`);
      return;
    }
    void toggle(colorId);
  }

  return (
    <>
      <FavoriteButton
        isFavorite={ids.includes(colorId)}
        onToggle={onToggle}
        className={className}
        disabled={authenticated && (busy || Boolean(error))}
      />
      {error && (
        <span className={styles.favoriteError} role="alert">
          {error}{" "}
          <button type="button" disabled={busy} onClick={() => void reload()}>Obnoviť</button>{" "}
          {error.includes("Prihláste") && <Link href="/login">Prihlásiť sa</Link>}
        </span>
      )}
    </>
  );
}
