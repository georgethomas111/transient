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

  function buildGossipPayload() {
    const filteredGlobal = {};

    for (const [key, entry] of Object.entries(state.global)) {
      if (entry && entry.ts && !Number.isNaN(Date.parse(entry.ts))) {
        filteredGlobal[key] = entry;
      }
    }

    return { from: nodeId, global: filteredGlobal };
  }

  async function tryGossip() {
    if (!pendingGossip) {
      return;
    }

    pendingGossip = false;
    const peers = selectRandomPeers(peerPorts, config.gossipPeersPerRound);
    const payload = buildGossipPayload();

    if (Object.keys(payload.global).length === 0) {
      return;
    }

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
    if (value === undefined || value === null) {
      res.status(400).json({ ok: false, nodeId, changed: false, error: "value is required" });
      return;
    }

    const ts = clock.now();
    applyLocalUpdate(state, value, ts);
    markUpdated();
    tryGossip();
    res.json({ ok: true, nodeId, changed: true, error: null, local: state.local });
  });

  app.post("/gossip", (req, res) => {
    const { global: incomingGlobal } = req.body || {};
    if (!incomingGlobal || typeof incomingGlobal !== "object" || Array.isArray(incomingGlobal)) {
      res.status(400).json({ ok: false, nodeId, changed: false, error: "global object is required" });
      return;
    }

    for (const incoming of Object.values(incomingGlobal)) {
      if (!incoming || typeof incoming !== "object" || !incoming.ts) {
        res.status(400).json({ ok: false, nodeId, changed: false, error: "global entries require ts" });
        return;
      }

      const parsed = Date.parse(incoming.ts);
      if (Number.isNaN(parsed)) {
        res.status(400).json({ ok: false, nodeId, changed: false, error: "invalid ts" });
        return;
      }
    }

    const nowMs = Date.now();
    const changed = mergeGlobal(state, incomingGlobal, nowMs);
    if (changed) {
      markUpdated();
      tryGossip();
    }
    res.json({ ok: true, nodeId, changed, error: null });
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
