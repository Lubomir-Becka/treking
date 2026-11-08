import { notFound, redirect } from "next/navigation";
import { Header } from "@/app/_components/Header/Header";
import { Footer } from "@/app/_components/Footer/Footer";
import { OrderDetailPage } from "@/app/pages/account/OrderDetailPage";
import { getCustomerOrderDetail } from "@/features/customer/composition/server";
import { resolveActor } from "@/shared/composition/server";

type Props = { params: Promise<{ orderNumber: string }> };

export default async function OrderDetailRoute({ params }: Props) {
  const { orderNumber } = await params;
  const actor = await resolveActor();
  if (actor.type !== "authenticated") {
    redirect(`/login?next=${encodeURIComponent(`/account/orders/${orderNumber}`)}`);
  }
  if (actor.role !== "customer") notFound();

  const order = await getCustomerOrderDetail(actor.userId, orderNumber);
  if (!order) notFound();

  return (
    <>
      <Header />
      <OrderDetailPage order={order} />
      <Footer />
    </>
  );
}
