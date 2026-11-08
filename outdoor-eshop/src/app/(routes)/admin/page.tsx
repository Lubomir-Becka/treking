import Link from "next/link";
import { redirect } from "next/navigation";
import { authorizeAdmin } from "@/shared/composition/server";
import { AdminPage } from "@/app/pages/admin/AdminPage";
import { categoryManagement, listAdminProducts } from "@/features/products/composition/server";
import { listAdminCustomers } from "@/features/session/composition/server";

export const dynamic = "force-dynamic";

export default async function AdminRoute() {
  const access = await authorizeAdmin();

  if (access.status === "unauthenticated") {
    redirect("/admin/login");
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

  const [categories, customers, products] = await Promise.all([
    categoryManagement.list(),
    listAdminCustomers(),
    listAdminProducts(),
  ]);
  return <AdminPage initialCategories={categories} initialCustomers={customers} initialProducts={products} />;
}
