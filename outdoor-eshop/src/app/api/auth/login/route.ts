import { loginCustomer } from "@/shared/composition/server";
import { handleLogin } from "@/shared/server/http/loginRequest";

export async function POST(request: Request) {
  return handleLogin(request, loginCustomer);
}
