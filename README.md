# coin-app

[![CI](https://github.com/carlosnapolesdev/coin-app/actions/workflows/ci.yml/badge.svg)](https://github.com/carlosnapolesdev/coin-app/actions/workflows/ci.yml)

Web client for **Crecik**, a personal finance management app. A Vue 3 SPA covering authentication, a dashboard, multi-currency accounts, transactions (with CSV import), budgets, savings goals, recurring transactions, reports, and settings — with full dark/light theming and three languages (English, Spanish, Portuguese).

Talks to the [`coin-api`](../coin-api) NestJS backend.

## Tech stack

- **Framework:** Vue 3.5 (`<script setup>` SFCs) + TypeScript
- **Build:** Vite 7 (`vue-tsc` type-checks the production build)
- **Styling:** Tailwind CSS 3 with semantic color tokens — see [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md)
- **Routing:** vue-router 4 with auth guards
- **i18n:** vue-i18n 9 (`en`, `es`, `pt`)
- **HTTP:** axios with JWT bearer interceptor
- **Tests:** Vitest + jsdom

## Getting started

```bash
npm install
npm run dev
```

The dev server proxies `/api` to the backend at `http://localhost:8080`, so run `coin-api` first. To point the proxy elsewhere, set `VITE_API_PROXY_TARGET` in your shell before starting Vite.

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Dev server with HMR and `/api` proxy |
| `npm run build` | Type-check (`vue-tsc -b`) + production build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run fonts:subset` | Regenerate the Material Symbols icon-font subset |
| `npm test` | Run the Vitest suite once |

### Icon font

Icons come from a Material Symbols subset generated from `src/config/icons.ts`.
After changing `UI_ICONS` or `CATEGORY_ICONS`, regenerate it:

```bash
npm run fonts:subset
```

The full font lives in `fonts-src/` (build input, never served).

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `/api` | Base URL the axios client uses; set it when the API is not served from the same origin |
| `VITE_API_PROXY_TARGET` | `http://localhost:8080` | Dev-only: where Vite proxies `/api` (read from the shell environment) |

## Project structure

```
src/
├── components/
│   ├── dashboard/   # Feature views: Dashboard, Accounts, Transactions, Budgets,
│   │                # Goals, Recurring, Reports, Categories, Settings + modals
│   ├── ui/          # Reusable component library (AppButton, AppModal, AppInput, …)
│   ├── common/      # TopHeader, UserMenu
│   └── *.vue        # Auth screens: Login, Register, ForgotPassword, ResetPassword
├── composables/     # useTheme, useLocale, useCountUp
├── i18n/            # vue-i18n setup + en/es/pt locales
├── router/          # Routes and auth guards
├── services/        # API modules (auth, accounts, transactions, budgets, goals, …)
└── utils/           # Formatting, currency, chart colors, initials
```

## Routing & auth

Public routes (`/login`, `/register`, `/forgot-password`, `/reset-password`) redirect to the dashboard when already authenticated; every other route requires a session and redirects to `/login` (preserving the target as `?redirect=`). The JWT is attached to every request, and any `401` response clears the session.

## Design system

All UI work must follow [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md): semantic Tailwind tokens (never raw colors), the shared `src/components/ui` library, and dark mode as the primary theme. If a screen disagrees with that document, the screen is wrong.

## Testing

Unit tests are co-located with their source as `*.test.ts` (composables, i18n, services, utils) and run on Vitest with a jsdom environment:

```bash
npm test
```
