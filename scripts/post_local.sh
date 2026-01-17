#!/usr/bin/env bash
set -euo pipefail

PORT="${1:-2727}"
VALUE="${2:-5}"

curl -s -X POST "http://localhost:${PORT}/key/save" \
  -H "Content-Type: application/json" \
  -d "{\"value\": ${VALUE}}"
