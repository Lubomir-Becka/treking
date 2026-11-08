import { createEnsureGuestSession } from "../../application/session/EnsureGuestSession";
import { createCustomerSession as buildCustomerSession } from "../../application/session/CreateCustomerSession";
import { createResolveActorContext } from "../../application/session/ResolveActorContext";
import { createRevokeSession } from "../../application/session/RevokeSession";
import { DrizzleSessionRepository } from "../../infrastructure/session/DrizzleSessionRepository";
import { NextSessionCookieAdapter } from "../../infrastructure/session/NextSessionCookieAdapter";
import { CryptoTokenService } from "../../infrastructure/session/CryptoTokenService";
import { DrizzleUserAccountRepository } from "../../infrastructure/session/DrizzleUserAccountRepository";
import { BcryptPasswordService } from "../../infrastructure/session/BcryptPasswordService";
import { createRegisterCustomer } from "../../application/session/RegisterCustomer";
import { createLoginCustomer } from "../../application/session/LoginCustomer";
import { LoginRateLimiter } from "../../infrastructure/session/LoginRateLimiter";
import type { GuestCartMergePort } from "../../domain/session/GuestCartMergePort";
import { createUpdateCustomerProfile } from "../../application/session/UpdateCustomerProfile";

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
