# MeterMate

A mobile-first app for landlords who sub-meter electricity: record each tenant's
monthly reading, get the bill worked out automatically, split a main bill across
meters to see what's left over, and send the tenant their amount on WhatsApp —
all in English, Hindi or Marathi.

Built by [Kantex Technologies](https://kantex.tech).

---

## Contents

- [What it does](#what-it-does)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Scripts](#scripts)
- [Project structure](#project-structure)
- [Data model](#data-model)
- [Authentication](#authentication)
- [Internationalisation](#internationalisation)
- [Testing](#testing)
- [Security](#security)
- [Deployment](#deployment)
- [Known limitations](#known-limitations)

---

## What it does

- **Home** (`/`) is the one screen most visits are for: this month's main bill,
  the total already billed across meters, the owner's remaining share, and a
  row per meter to record this month's reading — last month's value, an input
  for the new one, the computed bill, and a WhatsApp button once it's saved.
- **History** is a filterable popup (property / meter / month) opened from
  Home, not a separate page — it defaults to last month.
- **Settings** holds the main bill editor (the only place it can be changed),
  language, theme, the default tariff, account, and the rarely-touched
  property/meter management, ordered by how often each is actually used.
- **Onboarding** — new accounts add their first property and meter once, right
  after signup, and never see that flow again.
- **Accounts** — email + password, one landlord's data invisible to another.

## Tech stack

| Layer      | Choice                                                             |
| ---------- | ------------------------------------------------------------------ |
| Framework  | Next.js 16 (App Router, Turbopack)                                  |
| Language   | TypeScript, strict mode                                             |
| Database   | PostgreSQL via Prisma ORM                                           |
| Auth       | Auth.js v5 (Credentials provider, JWT sessions), bcrypt password hashing |
| Data layer | TanStack Query on the client, typed `fetch` wrapper (`lib/api.ts`)   |
| UI         | Tailwind CSS v4, Base UI primitives, `lucide-react` icons            |
| Forms      | `react-hook-form` + Zod                                              |
| i18n       | Hand-rolled (English / Hindi / Marathi), no framework                |
| Testing    | Vitest                                                               |
| Package manager | pnpm                                                            |

## Getting started

```bash
pnpm install
cp .env.example .env   # fill in DATABASE_URL and AUTH_SECRET (see below)
pnpm prisma migrate deploy
pnpm dev
```

The app runs at `http://localhost:3000`. The first account you sign up with
automatically inherits any pre-existing (unowned) properties and main bills in
the database — useful the first time you point this at a database that
already has data from before accounts existed.

To seed a fresh database with sample properties/meters/readings for local
development:

```bash
pnpm db:seed
```

## Environment variables

| Variable       | Required | Notes                                                                 |
| -------------- | -------- | ---------------------------------------------------------------------- |
| `DATABASE_URL` | Yes      | PostgreSQL connection string.                                          |
| `AUTH_SECRET`  | Yes      | Signs/encrypts session JWTs. Generate with the command in `.env.example`. |
| `AUTH_TRUST_HOST` | Only when self-hosting behind a reverse proxy (not Vercel) | Auth.js needs this to trust `X-Forwarded-Host`. Set to `true`. |

See `.env.example` for the exact format and a secret-generation command.

## Scripts

| Command             | What it does                                    |
| -------------------- | ------------------------------------------------ |
| `pnpm dev`            | Start the dev server                              |
| `pnpm build`          | Production build                                  |
| `pnpm start`          | Run a production build                            |
| `pnpm lint`           | ESLint                                            |
| `pnpm typecheck`      | `tsc --noEmit`                                    |
| `pnpm test`           | Vitest, once                                      |
| `pnpm db:migrate`     | Create/apply a migration in dev                   |
| `pnpm db:deploy`      | Apply pending migrations (use this in production) |
| `pnpm db:studio`      | Prisma Studio, a GUI for the database              |
| `pnpm db:seed`        | Seed sample data (destructive — see the script)    |

## Project structure

```
app/
  (app)/            Authenticated app shell — Home, Settings, Meters, Properties
  (auth)/            Login, signup, onboarding — outside the app shell
  api/               Route handlers (every one re-checks the session itself)
components/
  home/              Home screen: main-bill summary, reading rows, history sheet
  settings/          Settings screen
  auth/, onboarding/ Auth and first-run forms
  meters/, properties/, readings/  Meter/property CRUD, the shared history browser
  ui/                Design-system primitives (button, dialog, field, card, …)
lib/
  auth.ts            Auth.js configuration
  http.ts            Route-handler plumbing: error envelope, `requireUserId()`
  i18n/               Translation dictionaries + hook
  whatsapp.ts        wa.me link builder + bill-message template
  rate-limit.ts       In-memory rate limiter for auth endpoints
  validation.ts       Zod schemas, shared by client forms and API routes
  readings-service.ts The billing chain recalculation logic
prisma/
  schema.prisma       Data model
  migrations/         Migration history
```

## Data model

`User` → `Property` → `Meter` → `MonthlyReading`, plus a per-user, per-month
`MainBill`. A meter's readings form a chain: each month's `previousReading` is
the prior month's `currentReading`, and inserting, editing or deleting a
reading anywhere in that chain recomputes everything after it
(`lib/readings-service.ts`). The first reading on a meter is its baseline — it
records where the dial stood and bills nothing, since there's no earlier
figure to measure against.

`Meter.whatsappNumber` holds the tenant's WhatsApp number, used to build the
`wa.me` link on Home — no WhatsApp Business API or account is involved,
it's a plain deep link with a pre-filled message.

## Authentication

Email + password only (no OAuth, no email verification, no password reset —
see [Known limitations](#known-limitations)). Sessions are JWTs, not database
rows. `proxy.ts` (Next 16's renamed middleware) redirects signed-out visitors
to `/login` and signed-in-but-not-yet-onboarded ones to `/onboarding`, but
**that redirect is a UX convenience, not the security boundary** — every API
route calls `requireUserId()` (`lib/http.ts`) itself and scopes its Prisma
queries to that user, so a request straight to an API route is still checked.

Proxy always runs on the Node.js runtime in Next 16 (no Edge option), which
is why it's safe for `lib/auth.ts` to import Prisma there.

## Internationalisation

English, Hindi and Marathi, switchable from Settings, persisted per-device in
`localStorage` (`hooks/use-language.ts`). Translations are flat dictionaries
in `lib/i18n/translations/{en,hi,mr}.ts`, typed against English so a missing
key in another language fails the build rather than silently falling back.
`useTranslation()` returns `t(key, vars?)` with `{{var}}` interpolation.

Numbers and currency are **always** formatted in `en-IN` regardless of the
selected language (`lib/format.ts`) — only interface text changes.

Hindi/Marathi text renders in Noto Sans Devanagari (self-hosted via
`next/font`), since the app's primary font (Geist) has no Devanagari glyphs.

## Testing

```bash
pnpm test
```

Unit tests currently cover the pure logic most worth pinning down: the
WhatsApp link builder/number normalisation and the bill-message template
(`lib/whatsapp.test.ts`). There's no end-to-end test suite — verify UI changes
by running the app.

## Security

- Passwords hashed with bcrypt (12 rounds), never logged or returned by any API response.
- Every data-touching API route requires a session and scopes its queries to
  that user — see [Authentication](#authentication).
- Signup and login are rate-limited (in-memory, per-IP — see
  [Known limitations](#known-limitations)).
- Security headers set in `next.config.ts`: CSP, `X-Frame-Options: DENY`,
  `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`,
  no `X-Powered-By`, and `Cache-Control: no-store` on every API response.
- All database access goes through Prisma (parameterised queries) — no raw SQL
  in application code.
- `pnpm audit --prod` reports **no known vulnerabilities** as of this
  writing. A few transitive-only findings in unrelated tool chains
  (`fast-uri`, `deepmerge-ts` via an `@hookform/resolvers` subpath this app
  never imports) are pinned to patched versions in `pnpm-workspace.yaml`'s
  `overrides` for a clean report, even though the vulnerable code was never
  reachable at runtime.

Run `pnpm audit` before deploying to check current status — new advisories
get published regularly.

## Deployment

1. Provision a PostgreSQL database and set `DATABASE_URL`.
2. Set `AUTH_SECRET` (generate with the command in `.env.example`).
3. If hosting somewhere other than Vercel, set `AUTH_TRUST_HOST=true`.
4. Run migrations: `pnpm db:deploy` (safe for production — unlike
   `db:migrate`, it never prompts and never generates a new migration, only
   applies existing ones).
5. `pnpm build && pnpm start`, or deploy to a platform that runs those for
   you (Vercel, Railway, etc.).

The first account created after a fresh deploy against a database that
already has properties/main bills from before accounts existed will inherit
that data automatically (see [Getting started](#getting-started)).

## Known limitations

Worth knowing before relying on this in production:

- **No email verification or password reset.** A deliberate scope cut — see
  the project history. Add an email provider (e.g. Resend) and wire up
  Auth.js's verification/reset flows if this becomes a requirement.
- **Rate limiting is in-memory**, per process. It resets on restart and
  doesn't share state across multiple instances/regions. Fine for a single
  instance; swap for a shared store (e.g. Upstash Redis) before scaling out.
- **No audit log.** Reading edits/deletes aren't tracked beyond `updatedAt`.
- **First-signup data claiming has a narrow race window**: if two people
  signed up at the exact same instant on a fresh install, both could
  theoretically observe "zero users" and both attempt to claim orphaned rows.
  Postgres row-level locking prevents actual data corruption, but it's not
  formally serialised. Irrelevant once a second real user exists.
- **No end-to-end tests.** Verify UI changes manually.
- **Legal pages**: only a copyright line is included. There's no Privacy
  Policy or Terms of Service — add real ones (with real legal review) before
  collecting user data at any real scale.
