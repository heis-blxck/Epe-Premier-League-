# Epe Premier League

Official web app for the Epe Premier League: live scores, standings, fixtures,
fantasy football, news, match administration, and supporter accounts.

## Tech stack

- **Frontend:** React 19, TypeScript, Vite 6, Tailwind CSS 4
- **Backend:** Express (`server/app.ts`) with a Vite middleware dev server
- **Data / auth:** Supabase (Postgres, Auth)
- **Hosting:** Netlify (static frontend + Express API as a Netlify Function)

## Project structure

```text
.
├── src/                     # React application
│   ├── components/          # UI components and admin panels
│   ├── hooks/               # Reusable React hooks
│   ├── server/              # Server-side data store (imported by server/app.ts)
│   ├── services/            # API client and data services
│   ├── utils/               # Shared helpers (fantasy engine, clocks, etc.)
│   ├── App.tsx              # Application shell / routing
│   ├── main.tsx             # Browser entry point
│   └── types.ts             # Shared TypeScript types
├── public/                  # Static files served as-is (icons, manifest, SW)
├── data/                    # Local JSON database used by the Express server
├── database/                # Supabase schema
├── docs/                    # Notes and reference payloads
├── assets/                  # Source/design assets (not served)
├── scripts/                 # Developer and maintenance utilities
│   ├── tools/               # Asset generation helpers
│   ├── maintenance/         # Data reset / wipe / sync scripts
│   └── legacy/patches/      # Archived one-off patch scripts
├── tests/                   # Legacy test scripts and manual test pages
├── netlify/
│   └── functions/api.ts     # Netlify Function entry for the Express API
├── server/
│   └── app.ts               # Express app / all /api routes
├── server.ts                # Local dev + Node-host entry (Vite/static/listen)
├── index.html               # Vite HTML entry
├── netlify.toml             # Netlify build / functions / redirects / headers
└── vite.config.ts           # Vite configuration
```

## Local development

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create `.env` from the example and fill in your Supabase credentials:

   ```bash
   cp .env.example .env
   ```

3. Start the app (Express + Vite on <http://localhost:3000>):

   ```bash
   npm run dev
   ```

## Build and run

```bash
npm run build   # builds the frontend into dist/ and the server into dist/server.cjs
npm start       # serves dist/ with the Express server
```

Useful checks:

```bash
npm run lint    # TypeScript type check
npm run preview # preview the built frontend only
```

## Deployment

### Netlify (frontend + API)

`netlify.toml` builds the Vite frontend with `npx vite build`, publishes
`dist/`, and bundles `netlify/functions/api.ts` with esbuild. The function
wraps the Express app from `server/app.ts` with `serverless-http`, and the
redirect below sends `/api/*` to it:

```toml
[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/api/:splat"
  status = 200
  force = true
```

Set these environment variables in **Netlify → Site configuration →
Environment variables** (all environments, including Functions):

| Variable | Purpose |
| --- | --- |
| `VITE_SUPABASE_URL` | Supabase project URL (client + function) |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/publishable key (client + function) |
| `APP_URL` | `https://epe-premier-league.netlify.app` — used in auth email links |

`SUPABASE_URL` / `SUPABASE_ANON_KEY` are also accepted by the server, but the
Vite client needs the `VITE_` variants at build time.

The first request after a cold start waits for the initial Supabase hydration
to finish. Later requests reuse the warm function instance. If the function
cannot reach Supabase, check the Netlify function logs and the environment
variables above.

### Express / Node host

Deploy the repository to a Node host, run `npm run build`, then `npm start`.
The server serves the built frontend and the API from the same origin.

## Configuration files

| File | Purpose |
| --- | --- |
| `metadata.json` | AI Studio app metadata |
| `firebase-applet-config.json` | Firebase app configuration (legacy) |
| `firebase-blueprint.json` | Firebase data blueprint (legacy) |
| `firestore.rules` | Firestore security rules (legacy) |
| `database/supabase_schema.sql` | Supabase schema |

## Archived scripts

The repository previously kept hundreds of one-off `patch`, `fix`, `test`, and
`update` scripts in the project root. They now live under `scripts/` and
`tests/` so the root reflects only the application and its configuration. See
`scripts/README.md` for details.
