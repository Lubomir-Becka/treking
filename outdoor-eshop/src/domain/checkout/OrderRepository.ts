import type {
  PaymentMethodCode,
  ShippingMethodCode,
} from "./checkout";

export type CreateOrderInput = {
  userId: number;
  email: string;
  shippingMethod: ShippingMethodCode;
  firstName: string;
  lastName: string;
  street: string;
  city: string;
  postalCode: string;
  phone: string;
  country?: string;
  note?: string;
  paymentMethod: PaymentMethodCode;
};

export type CreatedOrder = {
  orderNumber: string;
  totalPrice: number;
};

export interface OrderRepository {
  create(input: CreateOrderInput): Promise<CreatedOrder>;
}
