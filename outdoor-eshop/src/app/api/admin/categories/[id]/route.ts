import { NextResponse } from "next/server";
import { categoryManagement } from "@/features/products/composition/server";
import { adminAccessError } from "@/shared/server/http/adminAccess";
import { categoryError, parseCategoryRequest } from "../categoryRequest";
import { isCategoryId } from "@/features/products/domain/CategoryManagement";

type Context = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Context) {
  try {
    const denied = await adminAccessError(request, true);
    if (denied) return denied;
    const rawId = (await params).id;
    const id = Number(rawId);
    if (!/^[1-9]\d*$/.test(rawId) || !isCategoryId(id)) {
      return NextResponse.json({ error: "Neplatná kategória." }, { status: 400 });
    }
    const parsed = await parseCategoryRequest(request);
    if (!parsed.valid) return NextResponse.json({ error: parsed.error }, { status: 400 });
    await categoryManagement.save(parsed.input, id);
    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    return categoryError(error);
  }
}

export async function DELETE(request: Request, { params }: Context) {
  try {
    const denied = await adminAccessError(request, true);
    if (denied) return denied;
    const rawId = (await params).id;
    const id = Number(rawId);
    if (!/^[1-9]\d*$/.test(rawId) || !isCategoryId(id)) {
      return NextResponse.json({ error: "Neplatná kategória." }, { status: 400 });
    }
    await categoryManagement.delete(id);
    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    return categoryError(error);
  }
}
