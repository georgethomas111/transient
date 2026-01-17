import { config } from "./config.js";
import { createNodeServer } from "./node.js";
import { createHttpTransport } from "./transport.js";
import { nowIso } from "./clock.js";

const transport = createHttpTransport();
const clock = { now: nowIso };

const nodes = [];
for (let i = 0; i < config.totalNodes; i += 1) {
  const port = config.basePort + i;
  nodes.push(
    createNodeServer({
      nodeId: i,
      port,
      config,
      clock,
      transport
    })
  );
}

let shuttingDown = false;

async function shutdown(signal) {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;

  console.log(`\nReceived ${signal}. Shutting down...`);

  const forceExit = setTimeout(() => {
    console.log("Forcing shutdown after 2s timeout.");
    process.exit(0);
  }, 2000);

  try {
    await Promise.all(nodes.map((node) => node.shutdown()));
  } finally {
    clearTimeout(forceExit);
    process.exit(0);
  }
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
