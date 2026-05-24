import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { createReadStream } from "node:fs";
import { extname, join, normalize } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname } from "node:path";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const dist = join(root, "dist");
const port = Number(process.env.PORT ?? 5173);
const host = "127.0.0.1";

const mime = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".map", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".webp", "image/webp"]
]);

export function createStaticServer(options = {}) {
  const baseUrl = `http://${options.host ?? host}:${options.port ?? port}`;

  return createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? "/", baseUrl);
      const pathname = decodeURIComponent(url.pathname);
      const requested = pathname === "/" ? "/index.html" : pathname;
      const filePath = normalize(join(dist, requested));

      if (!filePath.startsWith(dist)) {
        res.writeHead(403);
        res.end("Forbidden");
        return;
      }

      const fileStat = await stat(filePath);
      if (!fileStat.isFile()) {
        throw new Error("Not a file");
      }

      res.writeHead(200, {
        "Content-Type": mime.get(extname(filePath)) ?? "application/octet-stream",
        "Cache-Control": "no-store"
      });
      createReadStream(filePath).pipe(res);
    } catch {
      try {
        const fallback = await readFile(join(dist, "index.html"));
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(fallback);
      } catch {
        res.writeHead(404);
        res.end("Not found. Run npm run build first.");
      }
    }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const server = createStaticServer({ host, port });
  server.listen(port, host, () => {
    console.log(`Velocity Rift running at http://${host}:${port}`);
  });
}
