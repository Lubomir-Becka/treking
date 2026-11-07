import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer"; // predpokladáme, že aj footer bude v components/

export default function Home() {
  return (
    <div className="site-shell">
      {/* Vložený Header komponent */}
      <Header />

      <main>
        {/* Tu budú postupne pribúdať ďalšie sekcie (Hero, Lookbook, atď.) */}
      </main>

      {/* Vložený Footer komponent */}
      <Footer />
    </div>
  );
}