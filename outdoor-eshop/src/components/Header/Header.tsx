"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Logo } from "@/components/Logo/Logo";
import styles from "./header.module.css";

const RECENT_SEARCHES_KEY = "vertex-recent-searches";
const MAX_RECENT_SEARCHES = 5;

type IconName = "chevron-down" | "heart" | "search" | "shopping-cart" | "user-round";
type NavigationCategory = {
  name: string;
  slug: string;
  children: Array<{ name: string; slug: string }>;
};

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  return (
    <Image
      className={styles.icon}
      src={`/img/ui/${name}.svg`}
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
    />
  );
}

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

function isNavigationCategory(value: unknown): value is NavigationCategory {
  if (typeof value !== "object" || value === null) return false;
  const category = value as Record<string, unknown>;
  return (
    typeof category.name === "string" &&
    typeof category.slug === "string" &&
    Array.isArray(category.children) &&
    category.children.every(
      (child) =>
        typeof child === "object" &&
        child !== null &&
        "name" in child &&
        typeof child.name === "string" &&
        "slug" in child &&
        typeof child.slug === "string",
    )
  );
}

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const [authStatus, setAuthStatus] = useState<
    "loading" | "authenticated" | "anonymous" | "error"
  >("loading");
  const [cartCount, setCartCount] = useState(0);
  const [cartError, setCartError] = useState(false);
  const [categoriesError, setCategoriesError] = useState(false);
  const [categories, setCategories] = useState<Record<"men" | "women", NavigationCategory[]>>({
    men: [],
    women: [],
  });

  useEffect(() => {
    setRecentSearches(readRecentSearches());

    Promise.all((["men", "women"] as const).map(async (audience) => {
      const response = await fetch(`/api/categories?audience=${audience}`);
      if (!response.ok) {
        throw new Error("Category request failed.");
      }
      const payload: unknown = await response.json();
      if (
        typeof payload !== "object" ||
        payload === null ||
        !("data" in payload) ||
        !Array.isArray(payload.data) ||
        !payload.data.every(isNavigationCategory)
      ) {
        throw new Error("Category response is invalid.");
      }
      return [audience, payload.data] as const;
    })).then((entries) => {
      setCategories({ men: entries[0][1], women: entries[1][1] });
    }).catch(() => {
      setCategoriesError(true);
    });

    const updateCartCount = async () => {
      try {
        const response = await fetch("/api/cart");
        if (!response.ok) throw new Error("Cart request failed.");
        const payload: unknown = await response.json();
        if (
          typeof payload !== "object" ||
          payload === null ||
          !("data" in payload) ||
          typeof payload.data !== "object" ||
          payload.data === null ||
          !("items" in payload.data) ||
          !Array.isArray(payload.data.items) ||
          !payload.data.items.every(
            (item) =>
              typeof item === "object" &&
              item !== null &&
              "quantity" in item &&
              typeof item.quantity === "number" &&
              Number.isSafeInteger(item.quantity) &&
              item.quantity > 0,
          )
        ) {
          throw new Error("Cart response is invalid.");
        }
        setCartCount(
          payload.data.items.reduce(
            (total, item) => total + item.quantity,
            0,
          ),
        );
        setCartError(false);
      } catch {
        setCartError(true);
      }
    };

    updateCartCount();
    window.addEventListener("vertex-cart-updated", updateCartCount);
    return () => window.removeEventListener("vertex-cart-updated", updateCartCount);
  }, []);

  useEffect(() => {
    let active = true;

    fetch("/api/auth/session", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Session status could not be loaded.");
        }
        const payload: unknown = await response.json();
        if (
          typeof payload !== "object" ||
          payload === null ||
          !("data" in payload) ||
          typeof payload.data !== "object" ||
          payload.data === null ||
          !("authenticated" in payload.data) ||
          typeof payload.data.authenticated !== "boolean"
        ) {
          throw new Error("Session status response is invalid.");
        }
        if (active) {
          setAuthStatus(payload.data.authenticated ? "authenticated" : "anonymous");
        }
      })
      .catch(() => {
        if (active) setAuthStatus("error");
      });

    return () => {
      active = false;
    };
  }, [pathname]);

  useEffect(() => {
    if (!mobileSearchOpen) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setMobileSearchOpen(false);
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [mobileSearchOpen]);

  function navigateToSearch(searchQuery: string) {
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

  function openMobileSearch() {
    const currentQuery = new URLSearchParams(window.location.search).get("q");
    if (currentQuery) setQuery(currentQuery);
    setMobileSearchOpen(true);
  }

  function focusSearch() {
    if (window.matchMedia("(max-width: 800px)").matches) {
      openMobileSearch();
    }
  }

  async function logout() {
    setLogoutError(null);
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) {
        const payload: unknown = await response.json();
        const message =
          typeof payload === "object" &&
          payload !== null &&
          "error" in payload &&
          typeof payload.error === "string"
            ? payload.error
            : "Odhlásenie sa nepodarilo.";
        throw new Error(message);
      }
      setAuthStatus("anonymous");
      router.push("/login");
      router.refresh();
    } catch (error) {
      setLogoutError(
        error instanceof Error ? error.message : "Odhlásenie sa nepodarilo.",
      );
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
    <header className={styles.header}>
      <Logo />
      <nav className={styles.navigation} aria-label="Hlavná navigácia">
        {(["men", "women"] as const).map((audience) => (
          <details className={styles.navigationMenu} key={audience} name="header-audience">
            <summary>
              {audience === "men" ? "Páni" : "Dámy"} <Icon name="chevron-down" size={14} />
            </summary>
            <div className={styles.categoryDropdown}>
              <Link href={`/collections/${audience}`}>Všetky produkty</Link>
              {categories[audience].map((category) => (
                <div className={styles.categoryGroup} key={category.slug}>
                  <Link href={`/categories/${category.slug}?audience=${audience}`}>
                    {category.name}
                  </Link>
                  {category.children.map((subcategory) => (
                    <Link
                      className={styles.subcategoryLink}
                      href={`/categories/${subcategory.slug}?audience=${audience}`}
                      key={subcategory.slug}
                    >
                      {subcategory.name}
                    </Link>
                  ))}
                </div>
              ))}
              {categoriesError ? (
                <span role="alert">Kategórie sa nepodarilo načítať.</span>
              ) : categories[audience].length === 0 ? (
                <span>Žiadne kategórie</span>
              ) : null}
            </div>
          </details>
        ))}
      </nav>
      <form className={styles.search} onSubmit={submitSearch}>
        <Icon name="search" size={17} />
        <input
          aria-label="Hľadať výbavu"
          placeholder="Hľadať výbavu..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={focusSearch}
        />
      </form>
      <div className={styles.actions}>
        <Link className={styles.actionLink} href="/wishlist" aria-label="Obľúbené">
          <Icon name="heart" size={19} />
        </Link>
        <Link className={styles.actionLink} href="/checkout/cart" aria-label="Košík">
          <Icon name="shopping-cart" size={20} />
          <b>{cartCount}</b>
        </Link>
        {cartError && <span role="alert">Počet položiek v košíku sa nepodarilo načítať.</span>}
        {authStatus === "authenticated" ? (
          <details className={styles.accountMenu}>
            <summary className={styles.account} aria-label="Zákaznícky účet">
              <Icon name="user-round" size={18} />
              <span>Účet</span>
            </summary>
            <div className={styles.accountDropdown}>
              <Link href="/account">Môj účet</Link>
              <button type="button" onClick={logout}>Odhlásiť sa</button>
              {logoutError && <p role="alert">{logoutError}</p>}
            </div>
          </details>
        ) : authStatus === "anonymous" ? (
          <div className={styles.authLinks}>
            <Link href="/login">Účet</Link>
          </div>
        ) : authStatus === "error" ? (
          <span className={styles.accountLoading} role="status" aria-label="Stav účtu sa nepodarilo načítať" />
        ) : (
          <span className={styles.accountLoading} aria-hidden="true" />
        )}
      </div>
      {mobileSearchOpen && (
        <div className={styles.mobileSearchOverlay}>
          <div className={styles.mobileSearchHeader}>
            <form className={styles.mobileSearchForm} onSubmit={submitSearch}>
              <Icon name="search" size={18} />
              <input
                autoFocus
                aria-label="Hľadať výbavu"
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
                    <button type="button" onClick={() => {
                      setQuery(search);
                      navigateToSearch(search);
                    }}>
                      <Icon name="search" size={16} />
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
    </header>
  );
}
