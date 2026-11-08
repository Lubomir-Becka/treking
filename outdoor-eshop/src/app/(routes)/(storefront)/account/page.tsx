import { Footer } from "@/app/_components/Footer/Footer";
import { Header } from "@/app/_components/Header/Header";
import { AccountPage } from "@/app/pages/account/AccountPage";
import { AuthRequired } from "@/app/pages/account/AuthRequired";
import { getCustomerAccountData } from "@/features/customer/composition/server";
import { findCustomerById, resolveActor } from "@/shared/composition/server";

export default async function AccountRoute() {
  const actor = await resolveActor();

  const user =
    actor.type === "authenticated"
      ? await findCustomerById(actor.userId)
      : null;

  const accountData = user
    ? await getCustomerAccountData(user.id)
    : null;
  const customerProfile = user
    ? {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
      }
    : null;

  return (
    <>
      <Header />
      {customerProfile && accountData ? (
        <AccountPage user={customerProfile} accountData={accountData} />
      ) : (
        <AuthRequired />
      )}
      <Footer />
    </>
  );
}
