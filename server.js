// Serveur local : sert l'application et la route de correction /api/check.
// Usage : ANTHROPIC_API_KEY=... npm start
import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import checkHandler from "./api/check.js";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 8000;
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".webmanifest": "application/manifest+json",
  ".png": "image/png",
};
const PUBLIC = new Set(["index.html", "app.js", "words.js", "styles.css", "sw.js", "manifest.webmanifest"]);

http
  .createServer(async (req, res) => {
    const { pathname } = new URL(req.url, "http://localhost");
    if (pathname === "/api/check") return checkHandler(req, res);

    const rel = pathname === "/" ? "index.html" : decodeURIComponent(pathname.slice(1));
    if (!PUBLIC.has(rel) && !/^icons\/[\w.-]+$/.test(rel)) {
      res.statusCode = 404;
      return res.end("Not found");
    }
    try {
      const data = await fs.readFile(path.join(ROOT, rel));
      res.setHeader("Content-Type", TYPES[path.extname(rel)] || "application/octet-stream");
      res.end(data);
    } catch {
      res.statusCode = 404;
      res.end("Not found");
    }
  })
  .listen(PORT, () => {
    console.log(`Lexicon : http://localhost:${PORT}`);
    if (!process.env.ANTHROPIC_API_KEY) console.warn("ANTHROPIC_API_KEY absente : la correction des phrases ne fonctionnera pas.");
  });
