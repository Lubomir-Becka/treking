import CheckoutShell from "@/presentation/checkout/CheckoutShell";
import { isCheckoutRouteStep } from "@/domain/checkout/checkout";
import { resolveActor } from "@/composition/server";
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
