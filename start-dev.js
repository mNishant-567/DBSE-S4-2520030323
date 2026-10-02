import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("\x1b[36m%s\x1b[0m", "=================================================");
console.log("\x1b[36m%s\x1b[0m", "  Starting CareSync Full-Stack Care Platform     ");
console.log("\x1b[36m%s\x1b[0m", "=================================================");

// Start Backend
const backend = spawn("node", ["server/server.js"], {
  cwd: __dirname,
  stdio: "pipe",
  shell: true
});

backend.stdout.on("data", (data) => {
  process.stdout.write(`\x1b[35m[API Server]\x1b[0m ${data}`);
});
backend.stderr.on("data", (data) => {
  process.stderr.write(`\x1b[31m[API Error]\x1b[0m ${data}`);
});

// Start Frontend
const isWin = process.platform === "win32";
const npmCmd = isWin ? "npm.cmd" : "npm";

const frontend = spawn(npmCmd, ["run", "dev"], {
  cwd: path.join(__dirname, "long-term-disease-care-frontend"),
  stdio: "pipe",
  shell: true
});

frontend.stdout.on("data", (data) => {
  process.stdout.write(`\x1b[32m[Vite UI]\x1b[0m ${data}`);
});
frontend.stderr.on("data", (data) => {
  process.stderr.write(`\x1b[33m[Vite Warn]\x1b[0m ${data}`);
});

const cleanup = () => {
  console.log("\nShutting down servers...");
  backend.kill();
  frontend.kill();
  process.exit();
};

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);
