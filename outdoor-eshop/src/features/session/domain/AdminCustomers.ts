export type AdminCustomer = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  isActive: boolean;
};

export function isAdminEntityId(id: number) {
  return Number.isInteger(id) && id > 0 && id <= 2_147_483_647;
}
