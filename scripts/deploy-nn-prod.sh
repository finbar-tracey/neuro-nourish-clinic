#!/usr/bin/env bash
# Deploy NeuroNourish production on dedicated Vercel project.
# Requires Emer staging approval + go-live gate pass.
# Never targets bridging-loans-broker.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export VERTICAL="${VERTICAL:-neuronourish}"
export NEXT_PUBLIC_VERTICAL="${NEXT_PUBLIC_VERTICAL:-neuronourish}"

if [[ "${EMER_STAGING_APPROVED:-}" != "true" ]]; then
  echo "Refusing production deploy: set EMER_STAGING_APPROVED=true after Emer approves staging."
  exit 1
fi

echo "==> Go-live gate (production unlock)"
npm run quiz:go-live

echo "==> Link neuro-nourish-clinic"
npx vercel link --yes --project neuro-nourish-clinic --scope freewebguys-projects

LINKED="$(node -e "console.log(JSON.parse(require('fs').readFileSync('.vercel/project.json','utf8')).projectName||'')")"
if [[ "$LINKED" != "neuro-nourish-clinic" ]]; then
  echo "Refusing deploy: linked project is '$LINKED' (expected neuro-nourish-clinic)"
  exit 1
fi

echo "==> Ensure vertical env on Production"
printf 'neuronourish' | npx vercel env add VERTICAL production --force 2>/dev/null || true
printf 'neuronourish' | npx vercel env add NEXT_PUBLIC_VERTICAL production --force 2>/dev/null || true

echo "==> Production deploy"
URL="$(npx vercel deploy --yes --prod --scope freewebguys-projects)"
echo ""
echo "PRODUCTION URL: $URL"
echo "Quiz: $URL/quiz"
echo ""
echo "Note: neuronourish.clinic is still WordPress until DNS cutover."
echo "Point DNS only after Emer confirms this production URL."
