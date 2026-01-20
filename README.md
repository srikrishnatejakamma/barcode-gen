```markdown
# Barcode Generator — Next.js UI integration

This project replaces the previous static client with a Next.js React UI (in the `client/` folder). The Express server prepares and serves the Next app so the UI is available at `/` when the server runs. The server also exposes the barcode API at `/api/barcodes`.

Prerequisites
- Node.js 18+ (recommended)
- npm (or yarn)
- For packaging (electron-builder): platform-specific tooling may be required (e.g., NSIS on Windows, Xcode on macOS) — see packaging notes below.

Quick notes
- Next app location: `client/`
- API routes: `server.js` mounts Express API routes under `/api/*` before handing requests to Next.
- When `NODE_ENV=development`, Next runs in dev mode (HMR) when the server prepares Next.
- For production packaging, build the Next app before creating installers (see Build & Packaging).

Common commands

1. Install dependencies:
```bash
npm install
```

2. Development
- Run server (which prepares Next in dev mode):
```bash
npm run server:dev
```
This serves the UI at http://localhost:3000 and mounts the API at `/api/barcodes`.

- Run Electron (forks the server and opens the app window):
```bash
npm run dev
```

- Run Next dev server independently (optional, useful for frontend iteration):
```bash
npm run dev:client
```
Note: `dev:client` uses a different port (3001) to avoid conflicts with the server.

3. Build Next UI for production
```bash
npm run build:client
```

4. Packaging (after building the Next app)
- Build and package (the repository's `dist` script runs a pre-build step; you can also run build:client explicitly first):
```bash
npm run dist
```
Or explicitly:
```bash
npm run build:client
npm run dist
```

Notes & recommendations
- Server-first routing: API routes are mounted before Next's handler so `/api/*` is handled by Express.
- Ensure `MONGODB_URI` is set in `.env` to use a persistent MongoDB. If omitted, the app starts an in-memory MongoDB for convenience (data will be lost after the app exits).
- For production persistence of images, use S3 or GridFS rather than the local `uploads/` directory.
- Security:
  - Add input validation and rate-limiting for public deployments.
  - Do not expose the server publicly without authentication; add auth (JWT/session) if needed.
- CI/Packaging:
  - Build Next (`npm run build:client`) before running `electron-builder`.
  - electron-builder behaves best when run on the target OS for some targets:
    - macOS `.dmg`/notarization: build on macOS.
    - Windows NSIS: build on Windows (or ensure NSIS is available).
  - Consider using GitHub Actions with platform runners (`ubuntu-latest`, `windows-latest`, `macos-latest`) for multi-platform builds.

If you want
- Add additional UI pages (history of saved barcodes, settings).
- Convert the frontend into a standalone Next repository and add a monorepo build.
- Add CI steps that run `next build client` before building Electron installers.

```
