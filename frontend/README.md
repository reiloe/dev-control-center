# DevOps Control Center — Frontend

Single-page web dashboard built with **React 19**, **TypeScript**, **Vite**, and **Tailwind CSS v4**, and **Keycloak JS**.

## Development & Build

```bash
npm install
npm run dev      # Starts Vite dev server on http://localhost:5173 (proxies /api -> :8080)
npm run lint     # Runs ESLint across TypeScript files
npm run build    # Type-checks (tsc) and creates production bundle in dist/
```

## Features

* **Keycloak OIDC Login & RBAC:** Authenticates users against realm `dev-control-center` and adapts UI controls dynamically based on `ADMIN` vs. `VIEWER` realm roles.
* **Live Auto-Sync:** Polls `/api/services` every 5 seconds for real-time container health.
* **Profile & Search Filtering:** Filter services by Docker Compose profile (`postgres`, `seaweedfs`, `keycloak`, `monitoring`, etc.) or free-text search.
* **Container Controls & Logs:** Start/stop containers (`ADMIN` only) and inspect live stdout/stderr logs in a modal viewer.
* **Audit History & S3 Snapshots:** Inspect PostgreSQL audit logs in a slide-over drawer and trigger JSON status exports to SeaweedFS (S3) with Mailpit email notifications.
