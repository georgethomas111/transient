import express from "express";
import { createEmptyState, initializeGlobal, applyLocalUpdate, mergeGlobal } from "./state.js";
import { getPeerPorts, selectRandomPeers } from "./peers.js";

export function createNodeServer({ nodeId, port, config, clock, transport, logger = console }) {
  const app = express();
  app.use(express.json());

  const state = createEmptyState(nodeId);
  initializeGlobal(state, config.totalNodes);

  const peerPorts = getPeerPorts(config, nodeId);
  let pendingGossip = false;

  async function tryGossip() {
    if (!pendingGossip) {
      return;
    }

    pendingGossip = false;
    const peers = selectRandomPeers(peerPorts, config.gossipPeersPerRound);
    const payload = { from: nodeId, global: state.global };

    await Promise.all(
      peers.map(async (peerPort) => {
        try {
          await transport.send(peerPort, payload);
        } catch (error) {
          logger.warn(`[node ${nodeId}] gossip to ${peerPort} failed: ${error.message}`);
        }
      })
    );
  }

  function markUpdated() {
    pendingGossip = true;
  }

  app.get("/", (req, res) => {
    res.json({
      nodeId,
      port,
      endpoints: [
        {
          method: "GET",
          path: "/",
          description: "List available endpoints for this node."
        },
        {
          method: "GET",
          path: "/key",
          description: "Read local and global state for this node."
        },
        {
          method: "POST",
          path: "/key/save",
          description: "Set the local value and trigger gossip if state changed."
        },
        {
          method: "POST",
          path: "/gossip",
          description: "Merge incoming global state and gossip if it updates this node."
        }
      ]
    });
  });

  app.get("/key", (req, res) => {
    res.json({ nodeId, port, local: state.local, global: state.global });
  });

  app.post("/key/save", (req, res) => {
    const { value } = req.body || {};
    const ts = clock.now();
    applyLocalUpdate(state, value ?? null, ts);
    markUpdated();
    tryGossip();
    res.json({ ok: true, nodeId, local: state.local });
  });

  app.post("/gossip", (req, res) => {
    const { global: incomingGlobal } = req.body || {};
    const changed = mergeGlobal(state, incomingGlobal);
    if (changed) {
      markUpdated();
      tryGossip();
    }
    res.json({ ok: true, nodeId, changed });
  });

  const server = app.listen(port, () => {
    logger.info(`[node ${nodeId}] listening on ${port}`);
  });

  return {
    app,
    server,
    state,
    shutdown() {
      return new Promise((resolve) => server.close(resolve));
    }
  };
}
