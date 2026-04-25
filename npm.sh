#!/bin/bash
set -euo pipefail

if [ -z "${1:-}" ]; then
  echo "Usage: ./npm.sh <version>"
  echo "Example: ./npm.sh 0.0.1"
  exit 1
fi

VERSION="$1"

echo "Releasing moxi-js v${VERSION}..."

# Generate package.json
cat > package.json <<EOF
{
  "name": "moxi-js",
  "version": "${VERSION}",
  "description": "moxi.js - A Small Inline Scripting Companion for fixi.js",
  "main": "moxi.js",
  "files": [
    "moxi.js",
    "README.md"
  ],
  "repository": {
    "type": "git",
    "url": "https://github.com/bigskysoftware/moxi.git"
  },
  "author": "1cg",
  "license": "BSD-0",
  "keywords": [
    "moxi",
    "fixi",
    "htmx",
    "hypermedia",
    "inline",
    "reactive",
    "html"
  ],
  "bugs": {
    "url": "https://github.com/bigskysoftware/moxi/issues"
  }
}
EOF

echo "Generated package.json for v${VERSION}"

# Publish to npm
npm publish --access public

# Clean up
rm package.json

echo "Published moxi-js@${VERSION} to npm"