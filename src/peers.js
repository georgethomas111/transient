export function getPeerPorts({ basePort, totalNodes }, nodeId) {
  const ports = [];
  for (let i = 0; i < totalNodes; i += 1) {
    if (i === nodeId) {
      continue;
    }
    ports.push(basePort + i);
  }
  return ports;
}

export function selectRandomPeers(peerPorts, count) {
  const shuffled = [...peerPorts];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, Math.min(count, shuffled.length));
}
