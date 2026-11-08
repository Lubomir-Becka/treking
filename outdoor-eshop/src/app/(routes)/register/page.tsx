import { AuthForm } from "@/app/pages/auth/AuthForm";
import { getSafeNextPath } from "@/app/_utils/safeNextPath";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const params = await searchParams;
  const nextPath = getSafeNextPath(params.next);
  return <AuthForm mode="register" nextPath={nextPath} />;
}
