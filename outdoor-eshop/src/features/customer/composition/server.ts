import { DrizzleCustomerAccountRepository } from "../infrastructure/DrizzleCustomerAccountRepository";

const repository = new DrizzleCustomerAccountRepository();

export const getCustomerAccountData = (userId: number) =>
  repository.getAccountData(userId);
