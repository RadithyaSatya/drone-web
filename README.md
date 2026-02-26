# Drone Web

Web dashboard untuk monitoring dan operasi drone, dibangun dengan Vite + React + Tailwind CSS.

## Requirements

- Node.js 20+ dan npm
- Atau jalankan installer script agar Node.js/npm terpasang otomatis:
  - `scripts/install_mac.sh`
  - `scripts/install_ubuntu.sh`

## Quick Start

### macOS

```bash
bash scripts/install_mac.sh
```

### Ubuntu

```bash
bash scripts/install_ubuntu.sh
```

## Build (Production)

### macOS

```bash
APP_MODE=prod bash scripts/install_mac.sh
```

### Ubuntu

```bash
APP_MODE=prod bash scripts/install_ubuntu.sh
```

## Manual Setup

```bash
npm install
cp .env.example .env
npm run dev
```

## Environment Configuration

Copy `.env.example` menjadi `.env`, lalu sesuaikan nilainya.

```bash
VITE_API_BASE_URL=http://127.0.0.1:8080
VITE_WS_TELEMETRY_URL=ws://127.0.0.1:8080/ws/telemetry
VITE_DRONE_IDS=DRN-001
VITE_USER_ID=1
VITE_UAV_ID=1
VITE_CURRENT_LAT=-6.265223372536241
VITE_CURRENT_LON=106.96356208465653
VITE_CCTV_WHEP_URL=http://10.0.0.3:8889/hikvision/
```

Keterangan variabel:

- `VITE_API_BASE_URL`: Base URL backend HTTP API.
- `VITE_WS_TELEMETRY_URL`: URL WebSocket telemetry/docking.
- `VITE_DRONE_IDS`: Daftar ID drone, pisahkan dengan koma.
- `VITE_WS_DOCKING_URL` (opsional): Fallback jika `VITE_WS_TELEMETRY_URL` tidak diset.
- `VITE_DRONE_ID` (opsional): Fallback single ID jika `VITE_DRONE_IDS` tidak diset.
- `VITE_USER_ID`: User ID default untuk request tertentu.
- `VITE_UAV_ID`: UAV ID default untuk mission action.
- `VITE_CURRENT_LAT` / `VITE_CURRENT_LON`: Koordinat awal peta jika tersedia.
- `VITE_CCTV_WHEP_URL`: Endpoint WHEP untuk stream CCTV.

Catatan:

- Jika `VITE_CCTV_WHEP_URL` tidak diisi, panel CCTV akan menampilkan placeholder.
- Untuk development lokal, pastikan backend mengizinkan origin `http://localhost:5173` (CORS).

## NPM Scripts

- `npm run dev` - Menjalankan Vite dev server.
- `npm run build` - Build production ke folder `dist/`.
- `npm run preview` - Menjalankan preview hasil build.
- `npm run lint` - Menjalankan ESLint.
