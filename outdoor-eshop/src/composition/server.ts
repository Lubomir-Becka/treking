import { cartUseCases } from "@/composition/server/cart";
import type { CartActor } from "@/domain/cart/Cart";
import { createSessionComposition } from "@/composition/server/session";

export const session = createSessionComposition({
  mergeGuestCart: (guestTokenHash, userId) =>
    cartUseCases.mergeGuestCart(guestTokenHash, userId),
});

export const {
  ensureGuestActor,
  findCustomerById,
  loginCustomer,
  registerCustomer,
  resolveActor,
  revokeSession,
  updateCustomerProfile,
} = session;

export async function resolveCartActor(): Promise<CartActor> {
  const actor = await session.resolveActor();
  if (actor.type === "authenticated") {
    return { type: "authenticated", userId: actor.userId };
  }
  const guest = actor.type === "guest" ? actor : await session.ensureGuestActor();
  return { type: "guest", tokenHash: guest.tokenHash };
}
