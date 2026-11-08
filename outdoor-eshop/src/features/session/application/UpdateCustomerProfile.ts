import type { PasswordServicePort } from "../domain/PasswordServicePort";
import type { UserAccountRepository } from "../domain/UserAccountRepository";
import { isValidCustomerEmail } from "../../../shared/domain/email";

export type UpdateCustomerProfileInput = {
  firstName: string;
  lastName: string;
  email?: string;
  currentPassword?: string;
};

export function createUpdateCustomerProfile(
  accounts: UserAccountRepository,
  passwords: PasswordServicePort,
) {
  return async function updateCustomerProfile(
    userId: number,
    input: UpdateCustomerProfileInput,
  ) {
    const firstName = input.firstName.trim();
    const lastName = input.lastName.trim();
    const user = await accounts.findById(userId);

    if (!user || !user.isActive) {
      throw new Error("ACCOUNT_NOT_FOUND");
    }
    if (!firstName || firstName.length > 50 || !lastName || lastName.length > 50) {
      throw new Error("INVALID_PROFILE");
    }

    const email = input.email?.trim().toLowerCase();
    if (
      input.email !== undefined &&
      (!email || !isValidCustomerEmail(email))
    ) {
      throw new Error("INVALID_EMAIL");
    }

    const emailChanged = email !== undefined && email !== user.email;
    if (emailChanged && email) {
      if (
        !input.currentPassword ||
        !(await passwords.verify(input.currentPassword, user.passwordHash))
      ) {
        throw new Error("INVALID_CREDENTIALS");
      }

      const existingAccount = await accounts.findByEmail(email);
      if (existingAccount && existingAccount.id !== userId) {
        throw new Error("EMAIL_ALREADY_REGISTERED");
      }
    }

    try {
      const updatedUser = await accounts.updateProfile(userId, {
        firstName,
        lastName,
        ...(emailChanged && email ? { email } : {}),
      });

      return {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
      };
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "23505"
      ) {
        throw new Error("EMAIL_ALREADY_REGISTERED");
      }
      throw error;
    }
  };
}
