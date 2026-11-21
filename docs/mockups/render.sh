#!/bin/bash
# Renders the mockup frames in entry_points.html to PNG (2x) with headless Chrome.
cd "$(dirname "$0")"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
names=(1-monthly-push 2-did-you-buy 3-scout 4-app-tab 5-sold 6-services)
for i in 1 2 3 4 5 6; do
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=2 \
    --window-size=375,812 --virtual-time-budget=4000 \
    --screenshot="entry-${names[$((i-1))]}.png" "file://$PWD/entry_points.html?f=$i" 2>/dev/null
done
ls -la *.png
