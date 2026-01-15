# XFlight Mission Planner

Single-page mission planning dashboard built with Vite + React + Tailwind CSS.

## Requirements

- Node.js 18+ and npm (auto-installed by the scripts below)

## Quick Start (macOS)

```bash
bash scripts/install_mac.sh
```

## Quick Start (Ubuntu)

```bash
bash scripts/install_ubuntu.sh
```

## Build (macOS / Ubuntu)

```bash
APP_MODE=prod bash scripts/install_mac.sh
```

```bash
APP_MODE=prod bash scripts/install_ubuntu.sh
```

## Manual Setup

```bash
npm install
npm run dev
```

## Environment Configuration

Create or update `.env` in the project root:

```bash
VITE_API_BASE_URL=http://10.0.0.6:8080
VITE_USER_ID=1
VITE_UAV_ID=1
```

Notes:
- `VITE_API_BASE_URL` must be the backend base URL.
- If your backend enforces CORS, it must allow requests from `http://localhost:5173` for local dev.

## Scripts

- `npm run dev` - start Vite dev server
- `npm run build` - build for production
- `npm run preview` - preview production build
