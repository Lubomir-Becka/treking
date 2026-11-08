import { AuthForm } from "@/app/pages/auth/AuthForm";
import { getSafeNextPath, isAdminDestination } from "@/app/_utils/safeNextPath";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const params = await searchParams;
  const nextPath = getSafeNextPath(params.next);
  return (
    <AuthForm
      mode="login"
      nextPath={nextPath}
      loginOnly={isAdminDestination(nextPath)}
    />
  );
}
