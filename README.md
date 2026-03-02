# PhysioAve Frontend

Vue 3 + Vite frontend for the PhysioAve Management System.

## Tech Stack
- Vue 3 (TypeScript)
- Vite
- Pinia
- Vue Router
- PrimeVue + PrimeIcons
- Tailwind CSS
- TanStack Vue Query
- Axios
- Vitest + ESLint

## Prerequisites
- Node.js `^20.19.0` or `>=22.12.0`
- npm
- Running backend services:
  - PAMS backend API
  - PLA API (Philippine Location)
  - FSA API (File Server)

## Project Layout
- `src/app` - app shell, router, layouts
- `src/features` - feature modules/pages
- `src/services` - API service wrappers
- `src/utils/axios-interceptor.ts` - API base URL construction and Axios instances
- `.env.development` - local environment variables

## Environment Variables
This project reads `VITE_*` vars via Vite.

Current local template (`.env.development`):

- `VITE_PORT`
- `VITE_SCHEME`
- `VITE_MAX_FILE_SIZE_IN_BYTES`
- `VITE_PAMS_HOST`
- `VITE_PAMS_PORT`
- `VITE_PAMS_CONTEXT_PATH`
- `VITE_PLA_HOST`
- `VITE_PLA_PORT`
- `VITE_PLA_CONTEXT_PATH`
- `VITE_FSA_HOST`
- `VITE_FSA_PORT`
- `VITE_FSA_CONTEXT_PATH`

Notes:
- API URLs are built in `src/utils/axios-interceptor.ts`.
- PAMS requests use credentials (`withCredentials: true`) for cookie-based auth.

## Install
From the `frontend` directory:

```bash
npm ci
```

## Run in Development
```bash
npm run dev -- --host
```

Vite default URL is typically `http://localhost:5173`.

## Build and Preview
Build production assets:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Quality Checks
Type-check:

```bash
npm run type-check
```

Unit tests:

```bash
npm run test:unit
```

Lint (auto-fix enabled by script):

```bash
npm run lint
```

## Authentication Flow
- Login page triggers Google OAuth by redirecting to:
  - `{PAMS_BASE_URL}/oauth2/authorization/google`
- On successful login, backend sets secure cookies and redirects back to frontend.
- Frontend then calls authenticated endpoints (for example `/auth/me`) using `withCredentials`.

## Docker Deployment
Build image:

```bash
docker build -t pams-frontend .
```

Run container:

```bash
docker run --rm -p 80:80 pams-frontend
```

Notes:
- Multi-stage Dockerfile builds static assets with Node and serves them via Nginx.
- `nginx.conf` is configured for SPA routing with `try_files $uri /index.html`.

## Routes (High Level)
Primary app routes include:
- `/` (login)
- `/home`
- `/clinics`
- `/staffs`
- `/patients`
- `/hmos`
- `/machines`
- `/techniques`
- `/evaluations`
- `/appointments`
- `/billing`
- `/reports`
- `/refresh-tokens`
