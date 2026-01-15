#!/usr/bin/env bash
set -euo pipefail

APP_MODE=${APP_MODE:-dev}
NODE_VERSION=20

echo "== Drone Web Installer (Ubuntu) =="

if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
  echo "Node.js / npm not found. Installing Node.js LTS..."
  curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi

echo "Node version: $(node -v)"
echo "NPM version : $(npm -v)"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_ROOT"

echo "Installing npm dependencies..."
npm install

if [[ "$APP_MODE" == "dev" ]]; then
  echo "Starting dev server..."
  npm run dev
else
  echo "Building for production..."
  npm run build
  echo "Build completed."
fi
