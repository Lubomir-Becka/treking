import { DrizzleCustomerAccountRepository } from "../infrastructure/DrizzleCustomerAccountRepository";
import { DrizzleFavoriteColorRepository } from "../infrastructure/DrizzleFavoriteColorRepository";

const repository = new DrizzleCustomerAccountRepository();
export const favoriteColors = new DrizzleFavoriteColorRepository();

export const getCustomerAccountData = (userId: number) =>
  repository.getAccountData(userId);

export const getCustomerOrderDetail = (userId: number, orderNumber: string) =>
  repository.getOrderDetail(userId, orderNumber);
