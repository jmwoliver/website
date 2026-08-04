import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const root = new URL("../dist/", import.meta.url).pathname;
const site = new URL("https://www.jmw.sh");

function filesIn(directory) {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    return statSync(path).isDirectory() ? filesIn(path) : [path];
  });
}

function routeFor(file) {
  const path = relative(root, file).split(sep).join("/");
  if (path === "index.html") return "/";
  if (path.endsWith("/index.html")) return `/${path.slice(0, -"index.html".length)}`;
  return `/${path}`;
}

function resolvesLocally(pathname) {
  const decoded = decodeURIComponent(pathname).replace(/^\/+/, "");
  const target = join(root, decoded);
  return existsSync(target) || existsSync(join(target, "index.html"));
}

if (!existsSync(root)) {
  console.error("dist/ does not exist. Run npm run build first.");
  process.exit(1);
}

const missing = [];
for (const file of filesIn(root).filter((path) => path.endsWith(".html"))) {
  const html = readFileSync(file, "utf8");
  const route = routeFor(file);
  const attributes = html.matchAll(/\b(?:href|src)=["']([^"']+)["']/g);

  for (const [, value] of attributes) {
    if (/^(?:mailto:|tel:|data:|javascript:|#)/.test(value)) continue;
    const url = new URL(value, new URL(route, site));
    if (url.origin !== site.origin || resolvesLocally(url.pathname)) continue;
    missing.push(`${route} -> ${value}`);
  }
}

if (missing.length > 0) {
  console.error(`Found ${missing.length} broken local reference(s):\n${[...new Set(missing)].join("\n")}`);
  process.exit(1);
}

console.log("All built HTML links and assets resolve locally.");
