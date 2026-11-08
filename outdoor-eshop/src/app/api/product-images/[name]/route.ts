import { readProductImage } from "@/features/products/composition/server";

export async function GET(_request: Request, context: { params: Promise<{ name: string }> }) {
  try {
    const image = await readProductImage((await context.params).name);
    if (!image) return new Response("Not found", { status: 404 });
    return new Response(new Uint8Array(image), {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Reading product image failed:", error);
    return new Response("Unable to load image", { status: 500 });
  }
}
