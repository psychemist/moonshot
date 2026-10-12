import { serveStdio } from "@modelcontextprotocol/server/stdio";
import { createLearningGraphServer } from "./tools";

// stdout is reserved for the MCP protocol. Report failures only to stderr.
serveStdio(createLearningGraphServer, {
  onerror: () => console.error("Learning Graph MCP encountered a transport error."),
});
