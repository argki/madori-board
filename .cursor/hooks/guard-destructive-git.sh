#!/usr/bin/env bash
# beforeShellExecution: 破壊的な git 操作は確認を挟む
set -euo pipefail

# shellcheck source=lib.sh
source "$(cd "$(dirname "$0")" && pwd)/lib.sh"

input="$(cat)"
command="$(hook_json_get command "$input")"

if [[ -z "$command" ]]; then
  echo '{ "permission": "allow" }'
  exit 0
fi

if echo "$command" | grep -qE 'git[[:space:]]+push([^|;]*[[:space:]]--force|[^|;]*[[:space:]]-f)|git[[:space:]]+reset[[:space:]]+--hard|git[[:space:]]+clean[[:space:]]+-[a-zA-Z]*f'; then
  cat <<'EOF'
{
  "permission": "ask",
  "user_message": "破壊的な git 操作が含まれています。内容を確認してから実行してください。",
  "agent_message": "Hook が force push / hard reset / clean -f を検知しました。ユーザーの明示的な依頼がある場合のみ続行してください。"
}
EOF
  exit 0
fi

echo '{ "permission": "allow" }'
exit 0
