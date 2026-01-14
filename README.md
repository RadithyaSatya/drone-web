# XFlight Mission Planner

Single-page mission planning dashboard built with Vite + React + Tailwind CSS.

## Requirements

- Node.js 18+ and npm

## Quick Start (macOS)

```bash
bash scripts/install_mac.sh
```

## Quick Start (Ubuntu)

```bash
bash scripts/install_ubuntu.sh
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

## CORS & API Notes

- FE stack: React (Vite) + Tailwind CSS.
- HTTP client: native `fetch` (see `src/services/apiClient.js`).
- Base API URL: `http://10.0.0.6:8080`.
- Auth: no cookies by default. Authorization header is supported if you wire `getToken()` in `apiClient`.

Example request (no cookie):

```js
fetch('http://10.0.0.6:8080/missions/user/1', {
  method: 'GET',
  headers: { 'Content-Type': 'application/json' },
})
```

If you need cookies/authorization:

- FE must send `credentials: 'include'`.
- BE must set `Access-Control-Allow-Origin` to a specific origin (not `*`) and `Access-Control-Allow-Credentials: true`.

## Scripts

- `npm run dev` - start Vite dev server
- `npm run build` - build for production
- `npm run preview` - preview production build
