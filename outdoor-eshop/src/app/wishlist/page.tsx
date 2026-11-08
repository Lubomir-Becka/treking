import { Footer } from "@/components/Footer/Footer";
import { Header } from "@/components/Header/Header";
import { WishlistPage } from "@/presentation/customer/WishlistPage";

export default function WishlistRoute() {
  return (
    <>
      <Header />
      <WishlistPage />
      <Footer />
    </>
  );
}
