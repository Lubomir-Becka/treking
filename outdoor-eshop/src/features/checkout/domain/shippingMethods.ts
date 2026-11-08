import type { ShippingMethodCode } from "./checkout";

export const shippingMethods: ReadonlyArray<{
  code: ShippingMethodCode;
  name: string;
  price: string;
  freeFromAmount: string | null;
}> = [
  { code: "courier", name: "Kuriér na adresu", price: "5.90", freeFromAmount: "150.00" },
  { code: "pickup", name: "Osobný odber Ateliér Tatran", price: "0.00", freeFromAmount: null },
];
