// Check the built, crawler-visible HTML and PNG without running client JavaScript.
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const config = JSON.parse(await readFile(path.join(root, "artwork/social.json"), "utf8"));
const dist = path.join(root, config.dist);
const imageUrl = new URL(config.imagePath, config.url);
const original = await readFile(path.join(root, config.output));
const deployed = await readFile(path.join(dist, imageUrl.pathname));
assert(
  original.equals(deployed),
  "Build contains an outdated social image; rebuild after rendering.",
);
assert.equal(
  original.subarray(0, 8).toString("hex"),
  "89504e470d0a1a0a",
  "Social image must be PNG.",
);
assert.equal(original.readUInt32BE(16), 1200);
assert.equal(original.readUInt32BE(20), 630);
assert(original.length < 512 * 1024, "Keep the social card below 512 KiB.");
assert.equal(imageUrl.protocol, "https:");
assert.equal(imageUrl.origin, new URL(config.url).origin);
const decode = (value) =>
  value.replace(
    /&(?:amp|quot|apos|lt|gt|#39);/g,
    (entity) =>
      ({
        "&amp;": "&",
        "&quot;": '"',
        "&apos;": "'",
        "&#39;": "'",
        "&lt;": "<",
        "&gt;": ">",
      })[entity],
  );
const files = (await readdir(dist, { recursive: true })).filter((file) => file.endsWith(".html"));
assert(files.includes("index.html"));
for (const file of files) {
  const html = await readFile(path.join(dist, file), "utf8");
  const head = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1];
  assert(head, `${file}: missing head`);
  const metadata = new Map();
  for (const tag of head.matchAll(/<meta\b[^>]*>/gi)) {
    const attrs = Object.fromEntries(
      [...tag[0].matchAll(/([\w:-]+)\s*=\s*(["'])(.*?)\2/gs)].map((m) => [m[1], decode(m[3])]),
    );
    const key = attrs.property || attrs.name;
    if (!key?.startsWith("og:") && !key?.startsWith("twitter:")) continue;
    assert(!metadata.has(key), `${file}: duplicate ${key}`);
    metadata.set(key, attrs.content);
  }
  for (const [key, value] of Object.entries({
    "og:type": "website",
    "og:site_name": config.name,
    "og:image": imageUrl.href,
    "og:image:type": "image/png",
    "og:image:width": "1200",
    "og:image:height": "630",
    "og:image:alt": config.imageAlt,
    "twitter:card": "summary_large_image",
    "twitter:image": imageUrl.href,
    "twitter:image:alt": config.imageAlt,
  }))
    assert.equal(metadata.get(key), value, `${file}: ${key}`);
  for (const key of ["og:title", "og:description", "twitter:title", "twitter:description"])
    assert(metadata.get(key)?.trim(), `${file}: missing ${key}`);
  assert.equal(
    metadata.get("og:title"),
    metadata.get("twitter:title"),
    `${file}: card titles differ`,
  );
  assert.equal(
    new URL(metadata.get("og:url")).origin,
    imageUrl.origin,
    `${file}: canonical origin`,
  );
}
console.log(
  `${config.name}: ${files.length} crawler-visible pages; 1200×630 PNG (${Math.round(original.length / 1024)} KiB); OG/Twitter metadata consistent.`,
);
