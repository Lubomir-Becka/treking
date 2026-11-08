import { NextResponse } from "next/server";
import { addProductImage, changeProductImage, InvalidProductImage, MAX_IMAGE_BYTES, updateProductGallery } from "@/features/products/composition/server";
import { adminAccessError } from "@/shared/server/http/adminAccess";
import { isJsonObject, readJsonBody } from "@/shared/server/http/readJsonBody";
import { parseInventoryId } from "@/features/products/domain/AdminInventory";

type Context = { params: Promise<{ colorId: string }> };

async function change(request: Request, context: Context, upload: boolean, append = false) {
  try {
    const error = await adminAccessError(request, true);
    if (error) return error;
    const rawId = (await context.params).colorId;
    const colorId = Number(rawId);
    if (!/^[1-9]\d*$/.test(rawId) || !Number.isSafeInteger(colorId) || colorId > 2_147_483_647) {
      return NextResponse.json({ error: "Neplatná farebná verzia." }, { status: 400 });
    }

    let file: File | null = null;
    if (upload) {
      const contentType = request.headers.get("content-type");
      if (!contentType?.toLowerCase().startsWith("multipart/form-data;") || !request.body) {
        return NextResponse.json({ error: "Očakáva sa obrázok." }, { status: 400 });
      }
      const reader = request.body.getReader();
      const chunks: Uint8Array[] = [];
      let total = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        total += value.byteLength;
        if (total > MAX_IMAGE_BYTES + 64 * 1024) {
          await reader.cancel();
          return NextResponse.json({ error: "Súbor je príliš veľký." }, { status: 413 });
        }
        chunks.push(value);
      }
      let form: FormData;
      try {
        const bytes = new Uint8Array(total);
        let offset = 0;
        for (const chunk of chunks) {
          bytes.set(chunk, offset);
          offset += chunk.byteLength;
        }
        form = await new Response(new Blob([bytes]), {
          headers: { "Content-Type": contentType },
        }).formData();
      } catch {
        return NextResponse.json({ error: "Neplatná požiadavka." }, { status: 400 });
      }
      const files = form.getAll("image");
      if (files.length !== 1 || !(files[0] instanceof File)) {
        return NextResponse.json({ error: "Vyberte jeden obrázok." }, { status: 400 });
      }
      file = files[0];
    }
    const found = append && file
      ? await addProductImage(colorId, file)
      : await changeProductImage(colorId, file);
    if (!found) {
      return NextResponse.json({ error: "Farebná verzia sa nenašla." }, { status: 404 });
    }
    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    if (error instanceof InvalidProductImage) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Updating product image failed:", error);
    return NextResponse.json({ error: "Obrázok sa nepodarilo upraviť." }, { status: 500 });
  }
}

export function PUT(request: Request, context: Context) {
  return change(request, context, true);
}

export function DELETE(request: Request, context: Context) {
  return change(request, context, false);
}

export function POST(request: Request, context: Context) {
  return change(request, context, true, true);
}

export async function PATCH(request: Request, context: Context) {
  try {
    const error = await adminAccessError(request, true);
    if (error) return error;
    const rawId = (await context.params).colorId;
    const colorId = /^[1-9]\d*$/.test(rawId) ? parseInventoryId(Number(rawId)) : null;
    const body = await readJsonBody(request);
    if (!colorId || !body.valid || !isJsonObject(body.body)) {
      return NextResponse.json({ error: "Neplatné údaje galérie." }, { status: 400 });
    }
    const data = body.body;
    let result: "ok" | "not-found" | "conflict";
    if (data.type === "order" && Array.isArray(data.imageIds) &&
      data.imageIds.every((id: unknown) => parseInventoryId(id) !== null)) {
      result = await updateProductGallery(colorId, { type: "order", imageIds: data.imageIds });
    } else if ((data.type === "primary" || data.type === "delete") && parseInventoryId(data.imageId)) {
      const imageId = parseInventoryId(data.imageId);
      if (!imageId) return NextResponse.json({ error: "Neplatný obrázok." }, { status: 400 });
      result = await updateProductGallery(colorId, { type: data.type, imageId });
    } else {
      return NextResponse.json({ error: "Neplatné údaje galérie." }, { status: 400 });
    }
    if (result === "not-found") return NextResponse.json({ error: "Obrázok alebo farba neexistuje." }, { status: 404 });
    if (result === "conflict") return NextResponse.json({ error: "Galéria sa zmenila, obnovte údaje." }, { status: 409 });
    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    console.error("Updating product gallery failed:", error);
    return NextResponse.json({ error: "Galériu sa nepodarilo upraviť." }, { status: 500 });
  }
}
