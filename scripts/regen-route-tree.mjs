// One-shot route tree regeneration without vite (usable from any OS/CI).
import { Generator, getConfig } from "@tanstack/router-generator";

const config = await getConfig({
  routesDirectory: "./src/routes",
  generatedRouteTree: "./src/routeTree.gen.ts",
  target: "react",
});
const generator = new Generator({ config, root: process.cwd() });
await generator.run();
console.log("route tree regenerated");
