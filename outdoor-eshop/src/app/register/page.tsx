import { AuthForm } from "@/modules/customer/AuthForm";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const nextPath = params.next?.startsWith("/") ? params.next : "/account";
  return <AuthForm mode="register" nextPath={nextPath} />;
}
