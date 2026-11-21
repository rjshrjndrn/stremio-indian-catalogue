#!/usr/bin/env bash
# Smoke-check a running addon against real TMDB data. BASE=http://localhost:3000 by default.
set -euo pipefail
BASE=${BASE:-http://localhost:3000}
fail=0
ok()  { printf '  ok   %s\n' "$1"; }
bad() { printf '  FAIL %s\n' "$1"; fail=1; }

n=$(curl -fsS "$BASE/manifest.json" | jq '.catalogs | length')
[ "$n" = 8 ] && ok "manifest has 8 catalogs" || bad "manifest has $n catalogs, want 8"

for type in movie series; do
  for lang in ml ta mr hi; do
    p1=$(curl -fsS "$BASE/catalog/$type/in-$lang.json")
    p2=$(curl -fsS "$BASE/catalog/$type/in-$lang/skip=20.json")
    read -r total tt <<<"$(jq -r '[(.metas|length), ([.metas[].id|select(startswith("tt"))]|length)] | @tsv' <<<"$p1")"
    overlap=$(jq -n --argjson a "$p1" --argjson b "$p2" '[$a.metas[].id] - ([$a.metas[].id] - [$b.metas[].id]) | length')
    label="$type/$lang: $total items, $tt with IMDb id"
    if [ "$total" -eq 0 ]; then bad "$label (empty row)"
    elif [ "$overlap" -ne 0 ]; then bad "$label, page 2 repeats $overlap ids"
    else ok "$label, page 2 distinct"; fi
  done
done

# Vercel strips s-maxage before responding, so prove CDN caching by a HIT on a repeat request.
url="$BASE/catalog/movie/in-ml.json"
curl -fsS -o /dev/null "$url"
hdrs=$(curl -fsSI "$url" | tr -d '\r' | tr 'A-Z' 'a-z')
cc=$(awk -F': ' '$1=="cache-control"{print $2}' <<<"$hdrs")
hit=$(awk -F': ' '$1=="x-vercel-cache"{print $2}' <<<"$hdrs")
if [ -z "$hit" ]; then
  [[ "$cc" == *s-maxage=21600* ]] && ok "catalog Cache-Control (local): $cc" || bad "catalog Cache-Control: '$cc'"
else
  [[ "$hit" == hit || "$hit" == stale ]] && ok "CDN cache on repeat request: $hit" || bad "CDN cache on repeat request: $hit"
fi

exit $fail
