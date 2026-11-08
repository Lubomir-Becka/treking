import { NextResponse } from "next/server";
import { categoryManagement } from "@/features/products/composition/server";
import { adminAccessError } from "@/shared/server/http/adminAccess";
import { categoryError, parseCategoryRequest } from "./categoryRequest";

export async function GET(request: Request) {
  try {
    const denied = await adminAccessError(request);
    if (denied) return denied;
    return NextResponse.json({ data: await categoryManagement.list() }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return categoryError(error);
  }
}

export async function POST(request: Request) {
  try {
    const denied = await adminAccessError(request, true);
    if (denied) return denied;
    const parsed = await parseCategoryRequest(request);
    if (!parsed.valid) return NextResponse.json({ error: parsed.error }, { status: 400 });
    await categoryManagement.save(parsed.input);
    return NextResponse.json({ data: { success: true } }, { status: 201 });
  } catch (error) {
    return categoryError(error);
  }
}
