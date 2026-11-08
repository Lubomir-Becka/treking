"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { changeFavoriteColor, fetchFavoriteColorIds } from "@/features/customer/composition/favorites";

type FavoritesContextValue = {
  authenticated: boolean;
  ids: number[];
  busy: boolean;
  error: string | null;
  reload: () => Promise<void>;
  toggle: (colorId: number) => Promise<void>;
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ authenticated, children }: { authenticated: boolean; children: ReactNode }) {
  const [ids, setIds] = useState<number[]>([]);
  const [busy, setBusy] = useState(authenticated);
  const [error, setError] = useState<string | null>(null);
  const pending = useRef(false);

  const reload = useCallback(async () => {
    if (!authenticated || pending.current) return;
    pending.current = true;
    setBusy(true);
    try {
      setIds(await fetchFavoriteColorIds());
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Obľúbené položky sa nepodarilo načítať.");
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }, [authenticated]);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function toggle(colorId: number) {
    if (pending.current || busy || error || !authenticated) return;
    pending.current = true;
    setBusy(true);
    try {
      await changeFavoriteColor(colorId, !ids.includes(colorId));
      setIds(await fetchFavoriteColorIds());
      setError(null);
    } catch {
      setError("Zmenu sa nepodarilo overiť. Obnovte obľúbené položky.");
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }

  return (
    <FavoritesContext.Provider value={{ authenticated, ids, busy, error, reload, toggle }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) throw new Error("FavoritesProvider is missing.");
  return context;
}
