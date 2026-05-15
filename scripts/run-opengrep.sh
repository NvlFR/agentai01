#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

changed_only=false
json_output=false

while (($# > 0)); do
  case "$1" in
    --changed)
      changed_only=true
      ;;
    --json)
      json_output=true
      ;;
    *)
      echo "Unknown argument: $1" >&2
      exit 1
      ;;
  esac
  shift
done

scanner_bin="$(command -v opengrep || command -v semgrep || true)"
if [[ -z "$scanner_bin" ]]; then
  echo "opengrep/semgrep is not installed. Install one of them to run security scans." >&2
  exit 127
fi

node security/opengrep/compile-rules.mjs >/dev/null

targets=("src")
if [[ "$changed_only" == true ]]; then
  mapfile -t tracked_changed < <(git diff --name-only --diff-filter=ACMR HEAD -- src)
  mapfile -t untracked_changed < <(git ls-files --others --exclude-standard -- src)
  declare -A deduped=()
  changed_targets=()

  for target in "${tracked_changed[@]}" "${untracked_changed[@]}"; do
    [[ -z "$target" ]] && continue
    [[ -n "${deduped[$target]:-}" ]] && continue
    deduped["$target"]=1
    changed_targets+=("$target")
  done

  if ((${#changed_targets[@]} == 0)); then
    if [[ "$json_output" == true ]]; then
      mkdir -p .opengrep-out
      printf '{"results":[],"errors":[]}\n' > .opengrep-out/precise.json
      echo ".opengrep-out/precise.json"
    else
      echo "No changed src files to scan."
    fi
    exit 0
  fi

  targets=("${changed_targets[@]}")
fi

args=(scan --config security/opengrep/precise.yml)
if [[ "$json_output" == true ]]; then
  mkdir -p .opengrep-out
  args+=(--json --output .opengrep-out/precise.json)
fi
args+=("${targets[@]}")

"$scanner_bin" "${args[@]}"

if [[ "$json_output" == true ]]; then
  echo ".opengrep-out/precise.json"
fi
