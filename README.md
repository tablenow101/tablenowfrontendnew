# TableNow — Frontend

TableNow is a reservation platform paired with an AI phone hostess that takes calls 24/7 for restaurants. Customers call, the AI agent answers in natural language, books the table, and the reservation appears instantly in the restaurant's dashboard.

This repository contains the **frontend** (React + TypeScript + Vite). It powers two surfaces:

- The marketing site at `tablenow.io` (landing, sign-up, login)
- The restaurant app at `app.tablenow.io` (dashboard, bookings, call logs, settings, onboarding)

The voice agent and reservation API live in the `tablenowbackend` repository.

## Stack

- React 18 + TypeScript
- Vite 5 (dev server + build)
- React Router 6
- Tailwind CSS
- Supabase JS client (auth)
- Vapi web SDK (voice agent demo)
- Recharts (dashboard charts)
- Axios (API client)

## Getting started

Prerequisites: Node 18+ and npm.

```bash
npm install
cp .env.example .env   # then fill in your local values
npm run dev
```

The dev server runs on http://localhost:5173.

## Environment variables

Configured via `.env` (see `.env.example`):

| Variable        | Purpose                                            |
| --------------- | -------------------------------------------------- |
| `VITE_API_URL`  | Base URL of the TableNow backend API.              |

Production points to `https://api.tablenow.io`. For local development against a local backend, set it to `http://localhost:8000` (or whatever port your backend exposes).

## Scripts

| Command           | What it does                                |
| ----------------- | ------------------------------------------- |
| `npm run dev`     | Start the Vite dev server with HMR.         |
| `npm run build`   | Type-check (`tsc`) then produce a `dist/`.  |
| `npm run preview` | Serve the production build locally.         |
| `npm run lint`    | Run ESLint on the project.                  |

## Project layout

```
src/
  pages/        Route-level views (Landing, Login, Dashboard, Bookings, …)
  components/   Shared UI (Layout, onboarding steps)
  context/      React contexts (AuthContext)
  lib/          API client, domain helpers
  index.css     Tailwind entry + global styles
```

Routing is split by host in `src/App.tsx`: the marketing domain only exposes landing + auth, while the app domain exposes the authenticated restaurant dashboard under `/r/:restaurantSlug/*`.

## Deployment

The frontend is deployed on Vercel (`vercel.json` at the repo root). Pushes to `main` trigger a production deploy; pull requests get preview deploys automatically.
