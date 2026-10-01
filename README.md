# MeterMate

MeterMate is an electricity meter tracker for landlords. You record one number a
month per meter — what the dial says — and it works out the units consumed and
the bill from the previous reading, across as many properties and meters as you
have.

The app lives in [`metermate/`](./metermate).

## What it does

- **Properties → meters → readings.** A property is a building or unit you bill
  for; each meter under it keeps its own reading history.
- **Recording a reading is one number.** The form loads the reading the new one
  follows, pre-fills the rate from that meter's last bill, and shows the units
  and the bill live before you save.
- **Backfill in any order.** Enter March before February and the whole chain is
  recomputed — `previousReading`, units and bills stay correct for every month.
  Editing or deleting a reading recomputes everything after it too.
- **An overview scoped to the current cycle.** Billed and consumed this period
  with the change against the last one, how many meters are still unread (by
  name, with a way to record them on the spot), and a trend over the last twelve
  periods.
- **Full history**, filterable by property, meter and billing month, with
  server-side paging.

### How the billing chain works

A meter's readings form a chain: each month's `previousReading` is the prior
month's `currentReading`, `unitsConsumed` is the difference, and the bill is
units × rate.

The **first reading on a meter is a baseline**. A dial already showing 12,450
when you start tracking it doesn't mean anyone consumed 12,450 units, and there
is no earlier figure to subtract — so that entry records where the dial stood,
bills nothing, and billing starts from the second reading. Backfill an earlier
month later and the old first entry becomes a normal billed one.

A reading lower than the month before it is rejected with a message naming the
offending period, rather than silently producing a negative bill.

## Tech stack

- **Next.js 16** (App Router) and **React 19**
- **Tailwind CSS v4** with design tokens in `app/globals.css`
- **Prisma 6** against **PostgreSQL**
- **TanStack Query** for server state
- **react-hook-form** + **Zod** — the same schemas validate in the browser and on
  the server
- **Base UI** for dialogs, **sonner** for toasts, **lucide** for icons

## Getting started

You need Node 20+, pnpm, and a PostgreSQL database.

```bash
cd metermate
pnpm install

cp .env.example .env        # then point DATABASE_URL at your database
pnpm db:deploy              # apply migrations
pnpm db:seed                # optional: sample properties, meters and readings

pnpm dev
```

Open http://localhost:3000.

> `pnpm db:seed` **deletes all existing data** before inserting the sample set.
> Only run it against a development database.

### Scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` | Development server |
| `pnpm build` / `pnpm start` | Production build and server |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | TypeScript, no emit |
| `pnpm db:migrate` | Create and apply a migration in development |
| `pnpm db:deploy` | Apply existing migrations (use in CI and production) |
| `pnpm db:seed` | Reset to sample data |
| `pnpm db:studio` | Prisma Studio |

## Project layout

```text
metermate/
  app/
    (app)/            Application screens — overview, readings, meters, properties, settings
    api/              Route handlers (properties, meters, readings, dashboard)
    globals.css       Design tokens: colour, radius, elevation, motion
  components/
    app/              Shell: sidebar, mobile tab bar, page header, theme toggle
    ui/               Design system: button, card, field, dialog, badge, states…
    charts/           Dependency-free SVG consumption chart
    readings/ meters/ properties/ overview/ settings/    Feature screens and dialogs
  hooks/              Query hooks, preferences, element measurement
  lib/
    api.ts            Typed browser client
    types.ts          The API contract, shared by client and server
    validation.ts     Zod schemas used on both sides
    readings-service.ts   The billing arithmetic, in one place
    http.ts           Route wrapper and the shared error envelope
  prisma/             Schema, migrations, seed
```

## Notes on the API

Every route returns the same error envelope — `{ message, fields? }` — so the
client has one shape to render and forms can highlight the offending input.
Prisma `Decimal` values are serialised as JSON numbers at the boundary.

| Route | Methods |
| --- | --- |
| `/api/dashboard` | `GET` |
| `/api/properties` | `GET`, `POST` |
| `/api/properties/[id]` | `PATCH`, `DELETE` (`?cascade=true` to remove its meters and readings) |
| `/api/meters` | `GET`, `POST` |
| `/api/meters/[id]` | `GET`, `PATCH`, `DELETE` |
| `/api/meters/[id]/latest-reading` | `GET` (`?month=&year=` for backfill) |
| `/api/readings` | `GET` (filter + page), `POST` |
| `/api/readings/[id]` | `PATCH`, `DELETE` |

There is no authentication yet: the app assumes a single trusted operator and
every route reads and writes the whole database. Put it behind an authenticating
proxy, or add auth and scope the queries to an owner, before exposing it
publicly.

## Preferences

The default tariff and the light/dark/system theme are stored per device in
`localStorage`, and the settings screen says so. Properties, meters and readings
live in the database.
