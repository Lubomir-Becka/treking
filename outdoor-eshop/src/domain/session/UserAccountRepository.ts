export type UserAccount = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  passwordHash: string;
  isActive: boolean;
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
};

export interface UserAccountRepository {
  findByEmail(email: string): Promise<UserAccount | null>;
  findById(id: number): Promise<UserAccount | null>;
  create(input: CreateUserAccountInput): Promise<UserAccount>;
  updateProfile(id: number, input: UpdateUserProfileInput): Promise<UserAccount>;
}
