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

process.on("SIGINT", async () => {
  await Promise.all(nodes.map((node) => node.shutdown()));
  process.exit(0);
});
