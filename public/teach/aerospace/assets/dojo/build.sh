#!/bin/sh
# Builds Dojo.app next to this script. Bundle id: local.aerospace.dojo
set -e
cd "$(dirname "$0")"
APP=Dojo.app
rm -rf "$APP"
mkdir -p "$APP/Contents/MacOS"
swiftc -O -o "$APP/Contents/MacOS/Dojo" Dojo.swift
cat > "$APP/Contents/Info.plist" <<'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>CFBundleIdentifier</key><string>local.aerospace.dojo</string>
  <key>CFBundleName</key><string>Dojo</string>
  <key>CFBundleExecutable</key><string>Dojo</string>
  <key>CFBundlePackageType</key><string>APPL</string>
  <key>CFBundleShortVersionString</key><string>1.0</string>
  <key>LSMinimumSystemVersion</key><string>13.0</string>
  <key>NSHighResolutionCapable</key><true/>
</dict></plist>
PLIST
codesign -s - --force "$APP" >/dev/null 2>&1 || true
echo "built $(pwd)/$APP"
