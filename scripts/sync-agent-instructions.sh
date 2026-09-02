#!/bin/sh
# Sync the agent instruction files from the canonical AGENTS.md.
#
# Usage:
#   sh scripts/sync-agent-instructions.sh           regenerate the copies
#   sh scripts/sync-agent-instructions.sh --check    verify they are in sync (exit 1 if not)
#
# CLAUDE.md and .github/copilot-instructions.md are generated copies of AGENTS.md
# with a "do not edit" header. Edit AGENTS.md, then run this script.

set -eu

ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
SOURCE="$ROOT/AGENTS.md"
TARGETS="CLAUDE.md .github/copilot-instructions.md"

CHECK=0
case "${1-}" in
  --check) CHECK=1 ;;
  "") ;;
  *)
    echo "usage: $0 [--check]" >&2
    exit 2
    ;;
esac

if [ ! -f "$SOURCE" ]; then
  echo "error: AGENTS.md not found at $SOURCE" >&2
  exit 1
fi

# Print the generated content (header + canonical body) to stdout.
render() {
  cat <<'EOF'
<!--
  AUTO-GENERATED FILE — DO NOT EDIT.
  Source: AGENTS.md
  Regenerate: sh scripts/sync-agent-instructions.sh
-->

EOF
  cat "$SOURCE"
}

status=0

for target in $TARGETS; do
  path="$ROOT/$target"

  if [ "$CHECK" -eq 1 ]; then
    if [ ! -f "$path" ]; then
      echo "out of sync: $target is missing" >&2
      status=1
    elif ! render | diff -q - "$path" >/dev/null 2>&1; then
      echo "out of sync: $target differs from AGENTS.md" >&2
      status=1
    fi
    continue
  fi

  mkdir -p "$(dirname -- "$path")"
  render > "$path"
  echo "wrote $target"
done

if [ "$CHECK" -eq 1 ]; then
  if [ "$status" -ne 0 ]; then
    echo "run: sh scripts/sync-agent-instructions.sh" >&2
    exit 1
  fi
  echo "agent instruction files are in sync"
fi
