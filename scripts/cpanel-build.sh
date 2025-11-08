#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

log() {
  printf '[cpanel-build] %s\n' "$1"
}

log 'Installing frontend dependencies and building static bundle...'
(
  cd "$ROOT_DIR/frontend"
  npm ci
  npm run build
)

log 'Installing backend dependencies (production only)...'
(
  cd "$ROOT_DIR/server"
  npm ci --omit=dev
)

log 'Done. Upload the contents of frontend/dist to your cPanel public_html folder.'
log 'Deploy the server folder to the Node.js app directory and run npm start on the server.'

