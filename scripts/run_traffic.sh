#!/usr/bin/env bash
set -euo pipefail

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  cat <<'EOF'
Usage: ./scripts/run_traffic.sh [duration_seconds] [base_port] [total_nodes]

Arguments:
  duration_seconds  Total runtime in seconds (default: 300)
  base_port         Starting port for node 0 (default: 2727)
  total_nodes       Number of nodes to target (default: 4)

Behavior:
  Sends POST /key/save to a random node every ~8-12 seconds with a random value (0-99).

Example:
  ./scripts/run_traffic.sh 300 2727 4
EOF
  exit 0
fi

DURATION_SECONDS="${1:-300}"
BASE_PORT="${2:-2727}"
TOTAL_NODES="${3:-4}"

END_TIME=$((SECONDS + DURATION_SECONDS))

while [ "$SECONDS" -lt "$END_TIME" ]; do
  NODE_INDEX=$((RANDOM % TOTAL_NODES))
  PORT=$((BASE_PORT + NODE_INDEX))
  VALUE=$((RANDOM % 100))

  printf '%s\n' "$(date -u +"%Y-%m-%dT%H:%M:%SZ") -> POST /key/save to ${PORT} value=${VALUE}"
  ./scripts/post_local.sh "$PORT" "$VALUE" >/dev/null

  SLEEP_TIME=$((8 + RANDOM % 5))
  sleep "$SLEEP_TIME"
done
