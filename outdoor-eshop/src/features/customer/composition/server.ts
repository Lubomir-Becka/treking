import { DrizzleCustomerAccountRepository } from "../infrastructure/DrizzleCustomerAccountRepository";

const repository = new DrizzleCustomerAccountRepository();

export const getCustomerAccountData = (userId: number) =>
  repository.getAccountData(userId);

export const getCustomerOrderDetail = (userId: number, orderNumber: string) =>
  repository.getOrderDetail(userId, orderNumber);
