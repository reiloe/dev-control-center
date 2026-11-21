# DevOps Control Center — Frontend

Single-page web dashboard built with **React 19**, **TypeScript**, **Vite**, and **Tailwind CSS v4**.

## Development & Build

```bash
npm install
npm run dev      # Starts Vite dev server on http://localhost:5173 (proxies /api -> :8080)
npm run lint     # Runs ESLint across TypeScript files
npm run build    # Type-checks (tsc) and creates production bundle in dist/
```

## Features

* **Live Auto-Sync:** Polls `/api/services` every 5 seconds for real-time container health.
* **Profile & Search Filtering:** Filter services by Docker Compose profile (`postgres`, `monitoring`, `jenkins`, etc.) or free-text search.
* **Container Controls & Logs:** Start/stop containers directly from the UI and inspect live stdout/stderr logs in a modal viewer.
