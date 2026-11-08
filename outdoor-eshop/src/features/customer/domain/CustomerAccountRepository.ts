export type CustomerOrder = {
  orderNumber: string;
  status: string;
  totalPrice: number;
  createdAt: Date | null;
};

export type CustomerOrderDetail = CustomerOrder & {
  customerEmail: string;
  recipient: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
  phone: string;
  note: string | null;
  itemsSubtotal: number;
  shippingCost: number;
  shippingMethod: string | null;
  items: Array<{
    id: number;
    productName: string;
    sku: string;
    colorName: string | null;
    size: string | null;
    quantity: number;
    unitPrice: number;
  }>;
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
  getOrderDetail(userId: number, orderNumber: string): Promise<CustomerOrderDetail | null>;
}
