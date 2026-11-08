import { NextResponse } from "next/server";
import { deleteAdminCustomer, setAdminCustomerActive } from "@/features/session/composition/server";
import { isAdminEntityId } from "@/features/session/domain/AdminCustomers";
import { adminAccessError } from "@/shared/server/http/adminAccess";
import { isJsonObject, readJsonBody } from "@/shared/server/http/readJsonBody";
import { customerError } from "../customerRequest";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  try {
    const denied = await adminAccessError(request, true);
    if (denied) return denied;
    const rawId = (await context.params).id;
    const id = Number(rawId);
    if (!/^[1-9]\d*$/.test(rawId) || !isAdminEntityId(id)) {
      return NextResponse.json({ error: "Neplatný účet." }, { status: 400 });
    }
    const body = await readJsonBody(request);
    if (!body.valid || !isJsonObject(body.body) || typeof body.body.active !== "boolean") {
      return NextResponse.json({ error: "Neplatný stav účtu." }, { status: 400 });
    }
    const found = await setAdminCustomerActive(id, body.body.active);
    if (!found) return NextResponse.json({ error: "Zákaznícky účet neexistuje." }, { status: 404 });
    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    return customerError(error);
  }
}

export async function DELETE(request: Request, context: Context) {
  try {
    const denied = await adminAccessError(request, true);
    if (denied) return denied;
    const rawId = (await context.params).id;
    const id = Number(rawId);
    if (!/^[1-9]\d*$/.test(rawId) || !isAdminEntityId(id)) {
      return NextResponse.json({ error: "Neplatný účet." }, { status: 400 });
    }
    const found = await deleteAdminCustomer(id);
    if (!found) return NextResponse.json({ error: "Zákaznícky účet neexistuje." }, { status: 404 });
    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    return customerError(error);
  }
}
