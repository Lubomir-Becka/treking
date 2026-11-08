import { Footer } from "@/components/Footer/Footer";
import { Header } from "@/components/Header/Header";
import { AccountPage } from "@/presentation/customer/AccountPage";
import { AuthRequired } from "@/presentation/customer/AuthRequired";
import { getCustomerAccountData } from "@/composition/server/customer";
import { findCustomerById, resolveActor } from "@/composition/server";

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
