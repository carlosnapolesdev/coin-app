#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

CHROME="${CHROME:-google-chrome}"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

shot() {
  local html="$1" size="$2" out="$3"
  shift 3
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars \
    --window-size="$size" --virtual-time-budget=5000 "$@" \
    --screenshot="$out" "file://$PWD/$html" 2>/dev/null
}

for size in 16 32 48; do
  shot tile.html "${size},${size}" "$TMP/tile-$size.png" --default-background-color=00000000
done

node --input-type=module -e '
  import pngToIco from "png-to-ico"
  import { writeFile } from "node:fs/promises"
  const tmp = process.argv[1]
  const buffer = await pngToIco([16, 32, 48].map((size) => `${tmp}/tile-${size}.png`))
  await writeFile("../../public/favicon.ico", buffer)
' "$TMP"

shot icon.html 192,192 ../../public/icon-192.png
shot icon.html 512,512 ../../public/icon-512.png
shot icon.html 180,180 ../../public/apple-touch-icon.png
shot og.html 1200,630 ../../public/og.png

printf '%s\n' "Brand assets written to public/"
