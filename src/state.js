export function createEmptyState(nodeId) {
  return {
    nodeId,
    local: { value: null, ts: null },
    global: {}
  };
}

export function initializeGlobal(state, totalNodes) {
  for (let i = 0; i < totalNodes; i += 1) {
    state.global[String(i)] = { value: null, ts: null, gossipDelayMs: null };
  }
}

export function applyLocalUpdate(state, value, ts) {
  state.local = { value, ts };
  state.global[String(state.nodeId)] = { value, ts, gossipDelayMs: 0 };
}

export function mergeGlobal(state, incomingGlobal, nowMs) {
  let changed = false;

  if (!incomingGlobal || typeof incomingGlobal !== "object") {
    return false;
  }

  for (const [nodeId, incoming] of Object.entries(incomingGlobal)) {
    if (!incoming || typeof incoming !== "object") {
      continue;
    }

    const current = state.global[nodeId] || { value: null, ts: null, gossipDelayMs: null };
    if (!current.ts || (incoming.ts && incoming.ts > current.ts)) {
      const incomingMs = Date.parse(incoming.ts);
      const gossipDelayMs = Number.isNaN(incomingMs)
        ? null
        : Math.max(0, nowMs - incomingMs);

      state.global[nodeId] = {
        value: incoming.value ?? null,
        ts: incoming.ts ?? null,
        gossipDelayMs
      };
      changed = true;
    }
  }

  return changed;
}
