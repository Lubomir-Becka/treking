import { AuthForm } from "@/app/pages/auth/AuthForm";
import { getSafeNextPath, isAdminDestination } from "@/app/_utils/safeNextPath";
import { redirect } from "next/navigation";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const params = await searchParams;
  const nextPath = getSafeNextPath(params.next);
  if (isAdminDestination(nextPath)) {
    redirect("/admin/login");
  }
  return (
    <AuthForm
      mode="login"
      nextPath={nextPath}
    />
  );
}
