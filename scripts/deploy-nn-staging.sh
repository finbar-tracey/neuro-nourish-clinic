#!/usr/bin/env bash
# Deploy NeuroNourish staging preview for Emer review.
# Never targets bridging-loans-broker.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export VERTICAL="${VERTICAL:-neuronourish}"
export NEXT_PUBLIC_VERTICAL="${NEXT_PUBLIC_VERTICAL:-neuronourish}"

echo "==> Ensure Vercel project neuro-nourish-clinic"
if ! npx vercel project ls 2>/dev/null | grep -q "neuro-nourish-clinic"; then
  npx vercel project add neuro-nourish-clinic
fi

echo "==> Link dedicated NN project (not bridging-loans-broker)"
npx vercel link --yes --project neuro-nourish-clinic --scope freewebguys-projects

LINKED="$(node -e "console.log(JSON.parse(require('fs').readFileSync('.vercel/project.json','utf8')).projectName||'')")"
if [[ "$LINKED" != "neuro-nourish-clinic" ]]; then
  echo "Refusing deploy: linked project is '$LINKED' (expected neuro-nourish-clinic)"
  exit 1
fi

echo "==> Ensure vertical env on Preview"
add_env() {
  local key="$1"
  local val="$2"
  local env="$3"
  if npx vercel env ls "$env" 2>/dev/null | grep -q "^[[:space:]]*$key[[:space:]]"; then
    echo "  · $key already set on $env"
  else
    printf '%s' "$val" | npx vercel env add "$key" "$env" --yes
  fi
}
add_env VERTICAL neuronourish preview || true
add_env NEXT_PUBLIC_VERTICAL neuronourish preview || true
add_env NOTIFICATIONS_DRY_RUN true preview || true

echo "==> Go-live gate"
npm run quiz:go-live

echo "==> Deploy preview (staging)"
# Prefer plain URL output (avoid JSON mixing into shell capture)
URL="$(npx vercel deploy --yes --scope freewebguys-projects 2>/dev/null | grep -E '^https://' | tail -1)"
if [[ -z "$URL" ]]; then
  URL="https://neuro-nourish-clinic.vercel.app"
fi
echo ""
echo "STAGING URL (send to Emer): $URL"
echo "Stable alias: https://neuro-nourish-clinic.vercel.app"
echo "Quiz: https://neuro-nourish-clinic.vercel.app/quiz"
echo "Workspace: https://neuro-nourish-clinic.vercel.app/workspace/login"
echo ""
echo "After Emer reviews, verify live:"
echo "  NN_GO_LIVE_BASE_URL=https://neuro-nourish-clinic.vercel.app npm run quiz:go-live"
