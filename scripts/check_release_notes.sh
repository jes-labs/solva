#!/usr/bin/env bash
set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

BASE="${RELEASE_NOTES_BASE:-origin/main}"
APP_PATHS='^(apps|services|contracts|crates|circuits|packages|proto)/'

git fetch origin "${BASE#origin/}" --depth=200 >/dev/null 2>&1 || echo "Could not fetch ${BASE}; diffing against the local ref."

CHANGED=$(git diff --name-only "$BASE...HEAD")
CHANGED_APP_FILES=$(echo "$CHANGED" | grep -E "$APP_PATHS" || true)
RELEASE_NOTES=$(echo "$CHANGED" | grep -E '^docs/release-notes/[0-9]{4}-[0-9]{2}-[0-9]{2}-.+\.md$' || true)

if [ -z "$CHANGED_APP_FILES" ]; then
  echo -e "${GREEN}No application code changed. Release note not required.${NC}"
  exit 0
fi

if [ -z "$RELEASE_NOTES" ]; then
  echo -e "${YELLOW}Application code changed but no release note was added under docs/release-notes/:${NC}"
  echo "$CHANGED_APP_FILES" | sed 's/^/  - /'
  echo -e "${YELLOW}Add docs/release-notes/<YYYY-MM-DD>-<topic>.md from the template.${NC}"
  if [ "${STRICT_RELEASE_NOTES:-false}" = "true" ]; then
    echo -e "${RED}Release note check failed.${NC}"
    exit 1
  fi
  exit 0
fi

for note in $RELEASE_NOTES; do
  if ! grep -qE '^scenario-impact: (updated|needs_automation|none)$' "$note"; then
    echo -e "${RED}${note} is missing a valid scenario-impact line.${NC}"
    exit 1
  fi
done

echo -e "${GREEN}Release note found. Gate passed.${NC}"
