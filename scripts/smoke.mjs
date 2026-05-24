import { get } from "node:http";
import { createStaticServer } from "./serve.mjs";

const host = "127.0.0.1";
const server = createStaticServer({ host, port: 0 });

await new Promise((resolve) => server.listen(0, host, resolve));
const address = server.address();
const port = typeof address === "object" && address ? address.port : 0;

const checks = ["/", "/src/main.js", "/vendor/phaser.min.js"];

try {
  const results = [];
  for (const path of checks) {
    results.push(await request(path, port));
  }
  console.log(results.map((item) => `${item.path}=${item.status}`).join(" "));
} finally {
  await new Promise((resolve) => server.close(resolve));
}

function request(path, port) {
  return new Promise((resolve, reject) => {
    const req = get(`http://${host}:${port}${path}`, (res) => {
      res.resume();
      res.on("end", () => resolve({ path, status: res.statusCode }));
    });
    req.on("error", reject);
    req.setTimeout(3000, () => {
      req.destroy(new Error(`Timeout while requesting ${path}`));
    });
  });
}
