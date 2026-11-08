import { createEnsureGuestSession } from "../application/EnsureGuestSession";
import { createCustomerSession as buildCustomerSession } from "../application/CreateCustomerSession";
import { createResolveActorContext } from "../application/ResolveActorContext";
import { createRevokeSession } from "../application/RevokeSession";
import { DrizzleSessionRepository } from "../infrastructure/DrizzleSessionRepository";
import { NextSessionCookieAdapter } from "../infrastructure/NextSessionCookieAdapter";
import { CryptoTokenService } from "../infrastructure/CryptoTokenService";
import { DrizzleUserAccountRepository } from "../infrastructure/DrizzleUserAccountRepository";
import { BcryptPasswordService } from "../infrastructure/BcryptPasswordService";
import { createRegisterCustomer } from "../application/RegisterCustomer";
import { createLoginCustomer } from "../application/LoginCustomer";
import { LoginRateLimiter } from "../infrastructure/LoginRateLimiter";
import type { GuestCartMergePort } from "../domain/GuestCartMergePort";
import { createUpdateCustomerProfile } from "../application/UpdateCustomerProfile";

export function createSessionComposition(guestCartMerger: GuestCartMergePort) {
  const repository = new DrizzleSessionRepository();
  const cookies = new NextSessionCookieAdapter();
  const tokens = new CryptoTokenService();
  const accounts = new DrizzleUserAccountRepository();
  const passwords = new BcryptPasswordService();
  const rateLimiter = new LoginRateLimiter();

  const resolveActor = createResolveActorContext(
    cookies,
    repository,
    tokens,
  );
  const ensureGuestActor = createEnsureGuestSession(
    cookies,
    repository,
    tokens,
  );
  const createCustomerSession = buildCustomerSession(
    cookies,
    repository,
    tokens,
    guestCartMerger,
  );
  const revokeSession = createRevokeSession(
    cookies,
    repository,
    tokens,
  );
  const registerCustomer = createRegisterCustomer(
    accounts,
    passwords,
    createCustomerSession,
  );
  const loginCustomer = createLoginCustomer(
    accounts,
    passwords,
    rateLimiter,
    createCustomerSession,
  );
  const updateCustomerProfile = createUpdateCustomerProfile(accounts, passwords);

  return {
    createCustomerSession,
    ensureGuestActor,
    findCustomerById: (id: number) => accounts.findById(id),
    loginCustomer,
    registerCustomer,
    resolveActor,
    revokeSession,
    updateCustomerProfile,
  };
}
