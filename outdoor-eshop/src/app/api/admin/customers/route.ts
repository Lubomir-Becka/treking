import { NextResponse } from "next/server";
import { listAdminCustomers } from "@/features/session/composition/server";
import { adminAccessError } from "@/shared/server/http/adminAccess";
import { customerError } from "./customerRequest";

export async function GET(request: Request) {
  try {
    const denied = await adminAccessError(request);
    if (denied) return denied;
    return NextResponse.json({ data: await listAdminCustomers() }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return customerError(error);
  }
}
