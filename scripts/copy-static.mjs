import { copyFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const dist = join(root, "dist");

await mkdir(join(dist, "vendor"), { recursive: true });
await mkdir(join(dist, "src"), { recursive: true });

await copyFile(join(root, "index.html"), join(dist, "index.html"));
await copyFile(join(root, "src", "styles.css"), join(dist, "styles.css"));
await copyFile(
  join(root, "node_modules", "phaser", "dist", "phaser.min.js"),
  join(dist, "vendor", "phaser.min.js")
);

console.log("Static files copied to dist.");
