# JD Mart — Buy Smart, Sell Faster

JD Mart is a multi-role marketplace for Sierra Leone. One app serves six kinds of users:
**Buyers**, **Sellers**, **Dispatch Riders**, **Job Seekers**, **Employers** and **Admins**.
Prices are shown in Leones (Le).

## Tech stack

| Layer | What we use |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS 4, Lucide icons |
| Backend | Express 5 (`server.ts`), run with `tsx` |
| Data & auth | Firebase Auth, Cloud Firestore, Firebase Storage |
| AI | Google Gemini (server-side only) for product descriptions and image analysis |
| Email | Resend (optional; emails are only logged when no key is set) |

## Getting started

Requirements: Node.js 20 or newer.

```bash
npm install
cp .env.example .env      # then fill in the values (see below)
npm run dev               # starts Express + Vite on http://localhost:3000
```

Production:

```bash
npm run build             # type-check and build the web app into dist/
NODE_ENV=production npm start
```

### Environment variables

See `.env.example` for the full list. The important ones:

| Variable | Required | Purpose |
|---|---|---|
| `VITE_FIREBASE_*` | Yes | Firebase web config. The server also uses the API key to verify sign-in tokens. |
| `GEMINI_API_KEY` | For AI features | Server-side Gemini key. Never expose it to the browser. |
| `EMAIL_API_KEY`, `EMAIL_FROM` | For real emails | Resend credentials. Without them, emails are logged, not sent. |
| `ADMIN_ALERT_EMAIL` | Recommended | The only inbox that admin alerts are sent to. |
| `APP_URL` | Recommended in production | Links inside emails must point to this site. |
| `ALLOWED_ORIGINS` | Optional | Other origins allowed to call the API. Leave empty for same-origin. |

Firebase config also lives in `firebase-applet-config.json` (used as a fallback).
Security rules are in `firestore.rules` and `storage.rules`.

## Project structure

```
├── server.ts              Express server: API routes + serves the web app
├── server/security.ts     Auth check, rate limiting, input/upload validation
├── index.html, vite.config.ts
├── firestore.rules, storage.rules
├── public/assets/         Images, logos and icons
└── src/
    ├── main.tsx           Entry point
    ├── App.tsx            Routing and role-based route guards
    ├── context/           AppContext: global state and Firestore listeners
    ├── screens/           One file per page (buyer, seller, rider, jobs, admin)
    ├── components/        Shared UI (Header, Footer, drawers, toasts, chat)
    ├── lib/               Firebase setup, API client, uploads, helpers
    ├── types/             Shared TypeScript models
    ├── constants/, data/  Static and demo data
    └── index.css          Tailwind entry
```

## API routes

All routes except `/api/health` require a signed-in user. The client sends the
Firebase ID token automatically through `apiFetch` in `src/lib/api.ts`.

| Route | Purpose | Limit per user |
|---|---|---|
| `GET /api/health` | Health check | — |
| `POST /api/upload` | Upload an image or document (max 25MB) | 30 / 10 min |
| `POST /api/email/send` | Send a transactional email | 30 / hour |
| `POST /api/chat/webhook` | Chat message notification | 120 / min |
| `POST /api/ai/describe-image` | Suggest product details from a photo | 20 / 10 min |
| `POST /api/ai/generate-description` | Write a product description | 20 / 10 min |

Note: `/api/upload` stores files on the server's disk in `public/uploads/`. Many hosts
wipe the disk on redeploy, so moving uploads to Firebase Storage is planned.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server (Express + Vite) |
| `npm run build` | Type-check and build for production |
| `npm run lint` | Type-check only |
| `npm start` | Start the server (set `NODE_ENV=production` to serve `dist/`) |

## History

JD Mart was first built in Flutter and has been ported to React + TypeScript.
The old Flutter code was removed from this repository and remains in the git history.
