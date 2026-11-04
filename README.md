# Epe Premier League

Official web app for the Epe Premier League: live scores, standings, fixtures,
fantasy football, news, match administration, and supporter accounts.

## Tech stack

- **Frontend:** React 19, TypeScript, Vite 6, Tailwind CSS 4
- **Backend:** Express (`server.ts`) with a Vite middleware dev server
- **Data / auth:** Supabase (Postgres, Auth)
- **Hosting:** Netlify for the static frontend; Express for the API

## Project structure

```text
.
├── src/                     # React application
│   ├── components/          # UI components and admin panels
│   ├── hooks/               # Reusable React hooks
│   ├── server/              # Server-side data store (imported by server.ts)
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
├── server.ts                # Express API + production static server
├── index.html               # Vite HTML entry
├── netlify.toml             # Netlify build / redirects / headers
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

### Netlify (frontend)

`netlify.toml` builds the Vite frontend with `npx vite build` and publishes
`dist/`. The SPA redirect keeps client-side routes working on refresh.

> **API note:** Netlify serves the static frontend only. The app's `/api/*`
> routes are implemented in `server.ts`, so the full app needs a running
> Express backend. Point a Netlify proxy redirect for `/api/*` at that backend,
> or host the Express server somewhere that supports Node processes. Until then,
> API calls return a JSON 404 from `public/api-unavailable.json`.

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
