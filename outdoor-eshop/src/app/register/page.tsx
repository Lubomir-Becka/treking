import { AuthForm } from "@/presentation/session/client";
import { getSafeNextPath } from "../_utils/safeNextPath";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const params = await searchParams;
  const nextPath = getSafeNextPath(params.next);
  return <AuthForm mode="register" nextPath={nextPath} />;
}
