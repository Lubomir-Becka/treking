import CheckoutShell from "@/app/pages/checkout/CheckoutShell";
import { isCheckoutRouteStep } from "@/app/pages/checkout/checkoutNavigation";
import { resolveActor } from "@/shared/composition/server";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function CheckoutStepPage({
  params,
}: {
  params: Promise<{ step: string }>;
}) {
  const { step } = await params;
  if (!isCheckoutRouteStep(step)) {
    notFound();
  }

  const actor = await resolveActor();
  if (step !== "cart" && actor.type !== "authenticated") {
    redirect(`/login?next=${encodeURIComponent(`/checkout/${step}`)}`);
  }

  return <CheckoutShell step={step} />;
}
