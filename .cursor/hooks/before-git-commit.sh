#!/usr/bin/env bash
# beforeShellExecution: git commit の前に Docker 経由 format を促す
set -euo pipefail

# shellcheck source=lib.sh
source "$(cd "$(dirname "$0")" && pwd)/lib.sh"

input="$(cat)"
command="$(hook_json_get command "$input")"

if [[ -z "$command" ]]; then
  echo '{ "permission": "allow" }'
  exit 0
fi

if ! echo "$command" | grep -qE '(^|[[:space:];&|])git[[:space:]]+commit([[:space:]]|$)'; then
  echo '{ "permission": "allow" }'
  exit 0
fi

# 同一コマンド列に format が含まれる場合は許可
if echo "$command" | grep -qE 'npm run format|prettier --write'; then
  echo '{ "permission": "allow" }'
  exit 0
fi

cat <<'EOF'
{
  "permission": "ask",
  "user_message": "コミット前に Docker 経由でフォーマットしてください。例: docker compose run --rm web npm run format（web 起動中なら: docker compose exec -T web npm run format）",
  "agent_message": "コミット前にフォーマットが必要です。先に `docker compose run --rm web npm run format`（または web 起動中は `docker compose exec -T web npm run format`）を成功させてから、改めて git commit してください。ホストの node_modules 直叩きは使わないでください。"
}
EOF
exit 0
