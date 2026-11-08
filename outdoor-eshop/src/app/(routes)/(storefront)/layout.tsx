import { redirect } from "next/navigation";
import { resolveActor } from "@/shared/composition/server";
import { FavoritesProvider } from "@/app/_components/customer/FavoritesProvider";

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const actor = await resolveActor();

  if (actor.type === "authenticated" && actor.role === "admin") {
    redirect("/admin");
  }

  return (
    <FavoritesProvider
      key={actor.type === "authenticated" ? actor.userId : "guest"}
      authenticated={actor.type === "authenticated" && actor.role === "customer"}
    >
      {children}
    </FavoritesProvider>
  );
}
