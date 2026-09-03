// Rasterises public/icon*.svg into the PNG sizes the PWA manifest + iOS need.
// Run with: npm run icons
import sharp from "sharp";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const pub = new URL("../public/", import.meta.url);
const read = (name) => readFileSync(new URL(name, pub));
const dest = (name) => fileURLToPath(new URL(name, pub));

const jobs = [
  ["icon.svg", 192, "pwa-192.png"],
  ["icon.svg", 512, "pwa-512.png"],
  ["icon-maskable.svg", 512, "pwa-maskable-512.png"],
  ["icon-maskable.svg", 180, "apple-touch-icon.png"],
  ["icon.svg", 32, "favicon-32.png"],
];

for (const [src, size, out] of jobs) {
  await sharp(read(src)).resize(size, size).png().toFile(dest(out));
  console.log(`  ${out} (${size}x${size})`);
}
console.log("PWA icons generated.");
