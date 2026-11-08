import Link from "next/link";
import { redirect } from "next/navigation";
import { authorizeAdmin } from "@/shared/composition/server";
import { AdminPage } from "@/app/pages/admin/AdminPage";

export const dynamic = "force-dynamic";

export default async function AdminRoute() {
  const access = await authorizeAdmin();

  if (access.status === "unauthenticated") {
    redirect("/login?next=%2Fadmin");
  }

  if (access.status === "forbidden") {
    return (
      <main>
        <h1>Prístup zamietnutý</h1>
        <p>Administrácia je dostupná iba administrátorom.</p>
        <Link href="/account">Späť do účtu</Link>
      </main>
    );
  }

  return <AdminPage />;
}
