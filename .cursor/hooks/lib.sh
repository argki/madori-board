#!/usr/bin/env bash
# hooks 共通。他スクリプトから source する
# shellcheck shell=bash

HOOKS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$HOOKS_DIR/../.." && pwd)"
COMPOSE_SERVICE="${COMPOSE_SERVICE:-web}"

# stdin JSON からキーを1つ取る（python3 優先、なければ jq）
hook_json_get() {
  local key="$1"
  local input="${2:-}"
  if command -v python3 >/dev/null 2>&1; then
    HOOK_JSON_INPUT="$input" HOOK_JSON_KEY="$key" python3 - <<'PY'
import json, os, sys
raw = os.environ.get("HOOK_JSON_INPUT", "")
key = os.environ.get("HOOK_JSON_KEY", "")
try:
    data = json.loads(raw) if raw else {}
except json.JSONDecodeError:
    sys.exit(0)
val = data.get(key)
if val is None:
    sys.exit(0)
if isinstance(val, (dict, list)):
    print(json.dumps(val, ensure_ascii=False))
else:
    print(val)
PY
    return
  fi
  if command -v jq >/dev/null 2>&1; then
    echo "$input" | jq -r --arg k "$key" '.[$k] // empty' 2>/dev/null || true
    return
  fi
}

# web サービスが running か
compose_web_running() {
  command -v docker >/dev/null 2>&1 || return 1
  docker compose -f "$ROOT/compose.yml" ps --status running --services 2>/dev/null \
    | grep -qx "$COMPOSE_SERVICE"
}

# コンテナ内で prettier により単ファイル整形（起動中のみ）
compose_prettier_file() {
  local abs_or_rel="$1"
  local rel="$abs_or_rel"
  case "$rel" in
    "$ROOT"/*) rel="${rel#"$ROOT"/}" ;;
  esac
  [[ -f "$ROOT/$rel" ]] || return 1
  compose_web_running || return 1
  docker compose -f "$ROOT/compose.yml" exec -T "$COMPOSE_SERVICE" \
    npx prettier --write "$rel" >/dev/null 2>&1
}

# リポジトリ全体の format（コミット前用）
compose_format_all() {
  command -v docker >/dev/null 2>&1 || return 1
  [[ -f "$ROOT/compose.yml" ]] || return 1
  if compose_web_running; then
    docker compose -f "$ROOT/compose.yml" exec -T "$COMPOSE_SERVICE" npm run format
  else
    docker compose -f "$ROOT/compose.yml" run --rm "$COMPOSE_SERVICE" npm run format
  fi
}
