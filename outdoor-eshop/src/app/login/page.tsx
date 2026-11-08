import { AuthForm } from "@/modules/customer/AuthForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const nextPath = params.next?.startsWith("/") ? params.next : "/account";
  return <AuthForm mode="login" nextPath={nextPath} />;
}
