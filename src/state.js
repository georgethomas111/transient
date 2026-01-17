export function createEmptyState(nodeId) {
  return {
    nodeId,
    local: { value: null, ts: null },
    global: {}
  };
}

export function initializeGlobal(state, totalNodes) {
  for (let i = 0; i < totalNodes; i += 1) {
    state.global[String(i)] = { value: null, ts: null };
  }
}

export function applyLocalUpdate(state, value, ts) {
  state.local = { value, ts };
  state.global[String(state.nodeId)] = { value, ts };
}

export function mergeGlobal(state, incomingGlobal) {
  let changed = false;

  if (!incomingGlobal || typeof incomingGlobal !== "object") {
    return false;
  }

  for (const [nodeId, incoming] of Object.entries(incomingGlobal)) {
    if (!incoming || typeof incoming !== "object") {
      continue;
    }

    const current = state.global[nodeId] || { value: null, ts: null };
    if (!current.ts || (incoming.ts && incoming.ts > current.ts)) {
      state.global[nodeId] = { value: incoming.value ?? null, ts: incoming.ts ?? null };
      changed = true;
    }
  }

  return changed;
}
