#!/usr/bin/env bash

set -euo pipefail

# Always run from the repository root (directory of this script)
repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$repo_root"

timestamp="$(date '+%Y-%m-%d %H:%M:%S')"

green="\033[32m"
reset="\033[0m"

# Collect pending files (staged, unstaged, untracked)
changes=()
while IFS= read -r file; do
  [[ -z "$file" ]] && continue
  changes+=("$file")
done < <(
  {
    git diff --name-only --cached
    git diff --name-only
    git ls-files --others --exclude-standard
  } | grep -v '^$' | sort -u
)

if (( ${#changes[@]} )); then
  echo "本次更新文件："
  for file in "${changes[@]}"; do
    printf '  %b%s%b\n' "$green" "$file" "$reset"
  done
else
  echo "No changes detected."
fi

git add .

# Only commit when there is something staged
if git diff --cached --quiet; then
  echo "No changes to commit."
else
  git commit -m "$timestamp"
fi

git push origin main
