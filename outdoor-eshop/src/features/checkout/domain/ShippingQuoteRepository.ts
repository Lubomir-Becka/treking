export type ShippingMethodQuote = {
  code: string;
  name: string;
  price: string;
  freeFromAmount: string | null;
};

export interface ShippingQuoteRepository {
  findActiveMethods(): Promise<ShippingMethodQuote[]>;
}
