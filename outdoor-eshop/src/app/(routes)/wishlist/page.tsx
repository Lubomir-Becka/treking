import { Footer } from "@/app/_components/Footer/Footer";
import { Header } from "@/app/_components/Header/Header";
import { WishlistPage } from "@/app/pages/wishlist/WishlistPage";

export default function WishlistRoute() {
  return (
    <>
      <Header />
      <WishlistPage />
      <Footer />
    </>
  );
}
