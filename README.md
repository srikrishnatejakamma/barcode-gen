```markdown
# Barcode Generator — Next.js UI integration

This update replaces the static client/index.html with a full Next.js-based React UI (in the `client/` folder). The Express server now prepares and serves the Next.js app so the UI is available at `/` when the server runs.

Quick notes
- The Next.js app is located at `client/`.
- Server (server.js) integrates Next and routes API requests to `/api/*` (your existing Express routes).
- In development (NODE_ENV=development), Next runs in dev mode (HMR) when the server is started via `npm run server:dev` or when Electron forks the server under `npm run dev`.
- For production packaging, run the Next build before creating your installer so Next serves the optimized production build.

Common commands
1. Install dependencies:
   npm install

2. Development
   - Start the server (which will start Next in dev mode):
     npm run server:dev
   - Or run Electron (which will fork the server and Next in dev mode if NODE_ENV=development):
     npm run dev

   If you'd like to run Next's dev server directly (useful when iterating on frontend only):
     npm run dev:client

3. Build Next UI for production
   npm run build:client

   Then start the app in production (server will use the built Next app when NODE_ENV=production):
     NODE_ENV=production npm run server

4. Packaging (after building the Next app)
   npm run dist
   (Make sure to run `npm run build:client` first so the Next bundle is prepared.)

Notes & recommendations
- The server routes /api/* are mounted before Next's handler; Next serves all other routes (UI pages).
- For development, it's fine to let the Express server prepare Next in dev mode. If you prefer running Next independently (with `next dev`), you can do that and configure CORS or proxying as needed.
- Keep in mind to build the Next app (`npm run build:client`) as part of your CI or packaging step before invoking `electron-builder` to build installers.

If you want, I can:
- Add additional pages (e.g., history of saved barcodes, settings page).
- Convert the frontend into a separate standalone Next repository and wire up a monorepo build pipeline.
- Add automated CI steps that run `next build client` before building Electron installers.
```