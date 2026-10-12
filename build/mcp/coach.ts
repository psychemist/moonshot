import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const workingDirectory = fileURLToPath(new URL("../", import.meta.url));
const serverFile = fileURLToPath(new URL("./server.ts", import.meta.url));

// Command-line configuration affects this session only; no user config is edited.
const child = spawn("codex", [
  "--cd", workingDirectory,
  "-c", `mcp_servers.learning-graph.command=${JSON.stringify(process.execPath)}`,
  "-c", `mcp_servers.learning-graph.args=${JSON.stringify(["--import", import.meta.resolve("tsx"), serverFile])}`,
  "-c", `mcp_servers.learning-graph.cwd=${JSON.stringify(workingDirectory)}`,
  ...process.argv.slice(2),
], { cwd: workingDirectory, stdio: "inherit" });

child.on("error", () => {
  console.error("Could not start Codex. Install the Codex CLI and make sure codex is on PATH.");
  process.exitCode = 1;
});
child.on("exit", (code) => { process.exitCode = code ?? 1; });
