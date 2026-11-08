import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

function docker(args) {
  const result = spawnSync("docker", args, { encoding: "utf8" });
  if (result.error || result.status !== 0) throw new Error(result.stderr || result.error?.message);
  return result.stdout.trim();
}

export async function testProductImagesDocker({ databaseUrl, port, cookie, colorId, image }) {
  const volume = docker(["volume", "create"]);
  let container;
  const base = `http://127.0.0.1:${port}`;
  async function ready() {
    for (let attempt = 0; attempt < 60; attempt++) {
      try {
        const response = await fetch(`${base}/api/auth/session`);
        if (response.ok) return;
      } catch {
        await delay(500);
      }
    }
    throw new Error("Docker application did not become ready.");
  }
  try {
    container = docker([
      "run", "--detach", "--network", "host",
      "--env", `DATABASE_URL=${databaseUrl}`,
      "--env", `PORT=${port}`,
      "--env", "PRODUCT_IMAGE_DIRECTORY=/var/lib/outdoor-eshop/product-images",
      "--volume", `${volume}:/var/lib/outdoor-eshop/product-images`,
      "docker-app",
    ]);
    await ready();
    const body = new FormData();
    body.append("image", new Blob([image], { type: "image/png" }), "test.png");
    const response = await fetch(`${base}/api/admin/product-images/${colorId}`, {
      method: "PUT", headers: { cookie, origin: base }, body,
    });
    assert.equal(response.status, 200, await response.clone().text());
    const list = await (await fetch(`${base}/api/admin/product-images`, { headers: { cookie } })).json();
    const url = list.data.find((item) => item.colorId === colorId)?.imageUrl;
    assert.match(url, /^\/api\/product-images\//);
    const bytes = Buffer.from(await (await fetch(`${base}${url}`)).arrayBuffer());
    docker(["restart", container]);
    await ready();
    const afterRestart = await fetch(`${base}${url}`);
    assert.equal(afterRestart.status, 200);
    assert.deepEqual(Buffer.from(await afterRestart.arrayBuffer()), bytes);
    const catalog = await (await fetch(`${base}/api/products?colorIds=${colorId}`)).text();
    assert.ok(catalog.includes(url));
    console.log("Product image survives Docker container restart.");
  } finally {
    if (container) docker(["rm", "--force", container]);
    docker(["volume", "rm", volume]);
  }
}
