import "dotenv/config";
import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

function run(name, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const argsStr = ["npx", name, ...args].join(" ");
    const child = spawn(argsStr, { cwd: root, stdio: "inherit", shell: true, ...opts });
    child.on("error", reject);
    child.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`${name} exited ${code}`))));
  });
}

(async () => {
  try {
    await run("nestjs-trpc", [
      "generate",
      "--entrypoint",
      "src/app.module.ts",
      "--output",
      "../../packages/trpc/src/generated/",
    ]);
    await run("tsx", ["--import", "dotenv/config", "--watch", "src/main.ts"], { stdio: "inherit" });
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
})();
