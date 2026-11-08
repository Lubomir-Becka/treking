"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  fetchNavigationCategories,
  type NavigationCategory,
} from "@/features/products/composition/client";
import { HeaderIcon } from "./HeaderIcon";
import styles from "./header.module.css";

export function HeaderNavigation() {
  const [categoriesError, setCategoriesError] = useState(false);
  const [categories, setCategories] = useState<Record<"men" | "women", NavigationCategory[]>>({
    men: [],
    women: [],
  });

  useEffect(() => {
    let active = true;

    Promise.all((["men", "women"] as const).map(async (audience) => {
      return [audience, await fetchNavigationCategories(audience)] as const;
    })).then((entries) => {
      if (active) setCategories({ men: entries[0][1], women: entries[1][1] });
    }).catch(() => {
      if (active) setCategoriesError(true);
    });

    return () => {
      active = false;
    };
  }, []);

  function categoryMenus() {
    return (
      <>
      {(["men", "women"] as const).map((audience) => (
        <details className={styles.navigationMenu} key={audience} name="header-audience">
          <summary>
            {audience === "men" ? "Páni" : "Dámy"} <HeaderIcon name="chevron-down" size={14} />
          </summary>
          <div className={styles.categoryDropdown}>
            <Link href={`/collections/${audience}`}>Všetky produkty</Link>
            {categories[audience].map((category) => (
              <div className={styles.categoryGroup} key={category.slug}>
                <Link href={`/categories/${category.slug}?audience=${audience}`}>
                  {category.name}
                </Link>
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
      </>
    );
  }

  return (
    <nav className={styles.navigation} aria-label="Hlavná navigácia">
      {categoryMenus()}
    </nav>
  );
}
