import { DrizzleCustomerAccountRepository } from "../../infrastructure/customer/DrizzleCustomerAccountRepository";

const repository = new DrizzleCustomerAccountRepository();

export const getCustomerAccountData = (userId: number) =>
  repository.getAccountData(userId);
