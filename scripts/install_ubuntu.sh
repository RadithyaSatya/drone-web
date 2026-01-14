#!/usr/bin/env bash
set -euo pipefail

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js not found. Install it with:"
  echo "  curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -"
  echo "  sudo apt-get install -y nodejs"
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "npm not found. Install Node.js which includes npm."
  exit 1
fi

npm install
npm run dev
