import { Footer } from "@/app/_components/Footer/Footer";
import { Header } from "@/app/_components/Header/Header";
import type { ProductListItem } from "@/features/products/domain/product";
import { HeroSection } from "./sections/HeroSection";
import { LookbookSection } from "./sections/LookbookSection";
import styles from "./home.module.css";

export default function HomePage({
  menProducts,
  womenProducts,
}: {
  menProducts: ProductListItem[];
  womenProducts: ProductListItem[];
}) {
  return (
    <div className={styles["site-shell"]}>
      <Header />
      <main>
        <HeroSection />
        <LookbookSection
          menProducts={menProducts}
          womenProducts={womenProducts}
        />
      </main>
      <Footer />
    </div>
  );
}
