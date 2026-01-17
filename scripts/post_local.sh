#!/usr/bin/env sh
set -eu

if [ "${1:-}" = "-h" ] || [ "${1:-}" = "--help" ]; then
  cat <<'EOF'
Usage: sh scripts/post_local.sh [port] [value]

Arguments:
  port   Target node port (default: 2727)
  value  Value to store locally (default: 5)

Example:
  sh scripts/post_local.sh 2727 42
EOF
  exit 0
fi

PORT="${1:-2727}"
VALUE="${2:-5}"

PAYLOAD_TEMPLATE=$(cat <<'EOF'
{
  "value": "__VALUE__"
}
EOF
)

PAYLOAD=$(node -e 'const template = process.argv[1]; const value = process.argv[2]; let parsed = value; if (!Number.isNaN(Number(value)) && value.trim() !== "") { parsed = Number(value); } const payload = JSON.parse(template.replace("__VALUE__", String(parsed))); process.stdout.write(JSON.stringify(payload));' "$PAYLOAD_TEMPLATE" "$VALUE")

curl -s -X POST "http://localhost:${PORT}/key/save" \
  -H "Content-Type: application/json" \
  -d "${PAYLOAD}"
