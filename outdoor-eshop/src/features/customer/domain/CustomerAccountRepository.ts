export type CustomerOrder = {
  orderNumber: string;
  status: string;
  totalPrice: number;
  createdAt: Date | null;
  item: {
    productName: string;
    colorName: string | null;
    size: string | null;
    imageUrl: string | null;
  } | null;
};

export type CustomerAddress = {
  label: string | null;
  recipientName: string;
  street: string;
  city: string;
  postalCode: string;
  country: string | null;
  isDefault: boolean | null;
};

export type CustomerAccountData = {
  orders: CustomerOrder[];
  addresses: CustomerAddress[];
};

export type CustomerProfile = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
};

export interface CustomerAccountRepository {
  getAccountData(userId: number): Promise<CustomerAccountData>;
}
