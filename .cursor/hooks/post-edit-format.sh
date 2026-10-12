#!/usr/bin/env bash
# afterFileEdit: 対象ファイルを Docker Compose の web（起動中）で Prettier 整形する
# compose 未整備・web 未起動・対象外拡張子は何もしない（fail open）
set -euo pipefail

# shellcheck source=lib.sh
source "$(cd "$(dirname "$0")" && pwd)/lib.sh"

input="$(cat)"
file_path="$(hook_json_get file_path "$input")"
if [[ -z "$file_path" ]]; then
  exit 0
fi

case "$file_path" in
  *.ts|*.tsx|*.js|*.jsx|*.css|*.scss|*.json|*.md|*.yml|*.yaml|*.html) ;;
  *) exit 0 ;;
esac

# リポジトリ外は対象外
case "$file_path" in
  "$ROOT"/*) ;;
  /*) exit 0 ;;
  *) file_path="$ROOT/$file_path" ;;
esac

[[ -f "$ROOT/compose.yml" ]] || exit 0

compose_prettier_file "$file_path" || exit 0
exit 0
