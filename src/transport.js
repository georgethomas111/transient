export function createHttpTransport() {
  return {
    async send(port, payload) {
      const response = await fetch(`http://localhost:${port}/gossip`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Gossip failed to ${port}: ${response.status} ${text}`);
      }
    }
  };
}
