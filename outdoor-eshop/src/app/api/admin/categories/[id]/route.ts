import { NextResponse } from "next/server";
import { categoryManagement } from "@/features/products/composition/server";
import { adminAccessError } from "@/shared/server/http/adminAccess";
import { categoryError, parseCategoryRequest } from "../categoryRequest";

type Context = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Context) {
  try {
    const denied = await adminAccessError(request, true);
    if (denied) return denied;
    const parsed = await parseCategoryRequest(request);
    if (!parsed.valid) return NextResponse.json({ error: parsed.error }, { status: 400 });
    await categoryManagement.save(parsed.input, Number((await params).id));
    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    return categoryError(error);
  }
}

export async function DELETE(request: Request, { params }: Context) {
  try {
    const denied = await adminAccessError(request, true);
    if (denied) return denied;
    await categoryManagement.delete(Number((await params).id));
    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    return categoryError(error);
  }
}
