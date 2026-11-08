import type { UserRole } from "./UserRole";

export type UserAccount = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  passwordHash: string;
  isActive: boolean;
  role: UserRole;
};

export type CreateUserAccountInput = {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  phone?: string;
};

export type UpdateUserProfileInput = {
  email?: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
};

export interface UserAccountRepository {
  findByEmail(email: string): Promise<UserAccount | null>;
  findById(id: number): Promise<UserAccount | null>;
  create(input: CreateUserAccountInput): Promise<UserAccount>;
  updateProfile(id: number, input: UpdateUserProfileInput): Promise<UserAccount>;
}
