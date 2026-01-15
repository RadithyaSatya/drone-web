#!/usr/bin/env bash
set -euo pipefail

APP_MODE=${APP_MODE:-dev}
NODE_VERSION=20

echo "== Drone Web Installer (macOS) =="

if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
  if ! command -v brew >/dev/null 2>&1; then
    echo "Homebrew not found. Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  fi

  echo "Node.js / npm not found. Installing Node.js..."
  brew install node@${NODE_VERSION} || brew install node
  brew link --overwrite --force node@${NODE_VERSION} >/dev/null 2>&1 || true
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
