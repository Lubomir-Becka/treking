import { cartUseCases } from "@/features/cart/composition/server";
import type { CartActor } from "@/features/cart/domain/Cart";
import { createSessionComposition } from "@/features/session/composition/server";

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
