import { redirect } from "next/navigation";
import { AuthForm } from "@/app/pages/auth/AuthForm";
import { authorizeAdmin } from "@/shared/composition/server";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  const access = await authorizeAdmin();
  if (access.status === "allowed") {
    redirect("/admin");
  }

  return <AuthForm mode="login" loginOnly />;
}
