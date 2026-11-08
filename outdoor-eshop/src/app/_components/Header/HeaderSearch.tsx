"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { HeaderIcon } from "./HeaderIcon";
import { isValidCatalogQuery, MAX_CATALOG_QUERY_LENGTH } from "@/features/products/domain/catalogSearch";
import styles from "./header.module.css";

const RECENT_SEARCHES_KEY = "vertex-recent-searches";
const MAX_RECENT_SEARCHES = 5;

function readRecentSearches() {
  try {
    const stored = window.localStorage.getItem(RECENT_SEARCHES_KEY);
    if (!stored) return [];
    const value: unknown = JSON.parse(stored);
    return Array.isArray(value)
      ? value.filter((item): item is string => typeof item === "string")
      : [];
  } catch (error) {
    console.warn("Recent searches could not be loaded from local storage:", error);
    return [];
  }
}

export function HeaderSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [searchError, setSearchError] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  useEffect(() => {
    setRecentSearches(readRecentSearches());
  }, []);

  useEffect(() => {
    if (!mobileSearchOpen) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setMobileSearchOpen(false);
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [mobileSearchOpen]);

  function navigateToSearch(searchQuery: string) {
    if (!isValidCatalogQuery(searchQuery)) {
      setSearchError("Hľadaný text môže mať najviac 200 znakov a nesmie obsahovať riadiace znaky.");
      return;
    }
    setSearchError(null);
    const trimmedQuery = searchQuery.trim();
    if (trimmedQuery) {
      const searches = [
        trimmedQuery,
        ...recentSearches.filter(
          (search) => search.toLocaleLowerCase() !== trimmedQuery.toLocaleLowerCase(),
        ),
      ].slice(0, MAX_RECENT_SEARCHES);
      setRecentSearches(searches);
      try {
        window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(searches));
      } catch (error) {
        console.warn("Recent search could not be saved to local storage:", error);
      }
    }
    router.push(trimmedQuery ? `/search?q=${encodeURIComponent(trimmedQuery)}` : "/search");
    window.dispatchEvent(new CustomEvent("catalog-search", { detail: trimmedQuery }));
    setMobileSearchOpen(false);
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    navigateToSearch(query);
  }

  function focusSearch() {
    if (window.matchMedia("(max-width: 800px)").matches) {
      const currentQuery = new URLSearchParams(window.location.search).get("q");
      if (currentQuery) setQuery(currentQuery);
      setMobileSearchOpen(true);
    }
  }

  function clearRecentSearches() {
    setRecentSearches([]);
    try {
      window.localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch (error) {
      console.warn("Recent searches could not be cleared from local storage:", error);
    }
  }

  return (
    <>
      <form className={styles.search} onSubmit={submitSearch}>
        <HeaderIcon name="search" size={17} />
        <input
          aria-label="Hľadať výbavu"
          maxLength={MAX_CATALOG_QUERY_LENGTH}
          placeholder="Hľadať výbavu..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={focusSearch}
        />
      </form>
      {searchError && <p role="alert">{searchError}</p>}
      {mobileSearchOpen && (
        <div className={styles.mobileSearchOverlay}>
          <div className={styles.mobileSearchHeader}>
            <form className={styles.mobileSearchForm} onSubmit={submitSearch}>
              <HeaderIcon name="search" size={18} />
              <input
                autoFocus
                aria-label="Hľadať výbavu"
                maxLength={MAX_CATALOG_QUERY_LENGTH}
                placeholder="Hľadať výbavu..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              {query && (
                <button
                  type="button"
                  className={styles.clearSearch}
                  aria-label="Vymazať hľadaný text"
                  onClick={() => setQuery("")}
                >
                  ×
                </button>
              )}
            </form>
            <button
              className={styles.closeMobileSearch}
              type="button"
              onClick={() => setMobileSearchOpen(false)}
            >
              Zavrieť
            </button>
          </div>
          <section className={styles.recentSearches} aria-label="Posledné vyhľadávania">
            <div className={styles.recentSearchesHeading}>
              <h2>Posledné vyhľadávania</h2>
              {recentSearches.length > 0 && (
                <button type="button" onClick={clearRecentSearches}>
                  Vymazať
                </button>
              )}
            </div>
            {recentSearches.length > 0 ? (
              <ul>
                {recentSearches.map((search) => (
                  <li key={search}>
                    <button
                      type="button"
                      onClick={() => {
                        setQuery(search);
                        navigateToSearch(search);
                      }}
                    >
                      <HeaderIcon name="search" size={16} />
                      {search}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p>Vaše vyhľadávania sa uložia iba v tomto zariadení.</p>
            )}
          </section>
        </div>
      )}
    </>
  );
}
