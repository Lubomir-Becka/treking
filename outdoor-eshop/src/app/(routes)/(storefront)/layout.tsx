import { redirect } from "next/navigation";
import { resolveActor } from "@/shared/composition/server";

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const actor = await resolveActor();

  if (actor.type === "authenticated" && actor.role === "admin") {
    redirect("/admin");
  }

  return children;
}
