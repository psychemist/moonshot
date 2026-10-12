import { Client } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";
import { fileURLToPath } from "node:url";

/** Launch the real server, with paths independent of the caller's working directory. */
export async function connectLearningGraph(name: string) {
  const client = new Client({ name, version: "0.2.0" });
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: ["--import", import.meta.resolve("tsx"), fileURLToPath(new URL("./server.ts", import.meta.url))],
    cwd: fileURLToPath(new URL("../", import.meta.url)),
    stderr: "pipe",
  });
  await client.connect(transport);
  return client;
}
