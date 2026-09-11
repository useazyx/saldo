# Saldo

Personal finance app built around the bank statement. Import the CSV your bank exports, let
simple rules categorize it, and see where the money went each month: spending by category, the
trend over the last months and how much is left in each budget.

Leia em português: [README.pt-BR.md](README.pt-BR.md)

## Stack

- **Backend:** Node.js 22, TypeScript, Fastify 5, Prisma 6, PostgreSQL, Zod 4
- **Frontend:** React 19, Vite, Tailwind CSS 4, TanStack Query, Recharts
- **Tests:** Vitest on both sides (the API against a real PostgreSQL database, the UI with Testing Library)

## Running it

You need Node.js 22.12+ and PostgreSQL running on `localhost:5432`.

```bash
cd backend
npm install
npm run dev        # http://localhost:3336, docs at /docs
```

```bash
cd frontend
npm install
npm run dev        # http://localhost:5176
```

The backend's `npm run dev` creates `.env` from `.env.example` (with a random JWT secret), creates
the database, applies the migrations and loads a demo account. The frontend proxies `/api` to the
backend, so there is nothing else to configure. If your Postgres user isn't `postgres/postgres`,
change `DATABASE_URL` in `backend/.env`.

**Demo account:** `ana@saldo.dev` / `saldo123`, with a checking account, a credit card, rules,
four months of transactions and a few budgets (one of them already over the limit).

## What it does

- **Import statements** from Nubank (checking account and credit card are detected by their headers)
  or any CSV with date, description and amount columns. Comma or semicolon, Brazilian or US number
  format, `DD/MM/YYYY` or ISO dates, UTF-8 or Latin-1. You see a preview first: new rows, rows
  already imported, suggested categories and the lines that will be skipped, with the reason.
- **Categorize automatically** with rules like "description contains `ifood` → Restaurants". The most
  specific rule wins (`uber eats` beats `uber`), and a new rule can be applied to what is already
  uncategorized without touching manual choices.
- **Transactions** with filters that live in the URL (month, account, category, type, search),
  inline category changes, manual entries for cash spending and totals for whatever is filtered.
- **Dashboard** with the month's balance, income and expenses compared with the previous month,
  spending by category and a six-month trend.
- **Budgets** per category and month, with status (ok, close to the limit, over) and a button to
  copy last month's limits.

## Decisions worth mentioning

- **Re-importing never duplicates.** Each row gets a fingerprint (date, amount, description and how
  many identical rows came before it in the same file), unique per account in the database. Two
  identical coffees on the same day are two transactions; importing the same file again adds none.
- **Amounts are integers in cents with a sign.** Expenses are negative. Nubank's credit card export
  lists purchases as positive values, so that format is flipped on import.
- **Reports are aggregated in PostgreSQL**, not in JavaScript: `GROUP BY` for categories and budgets,
  and a single query with `date_trunc` for the monthly trend, with empty months filled in.
- **Colors follow a palette validated for color vision deficiency.** Categories store a hue name,
  not a hex, so the UI picks the right step for light or dark mode. There are exactly eight hues;
  beyond seven categories the chart folds the rest into "Others" instead of inventing colors. Status
  (budget over the limit) always comes with an icon and text, never color alone, and every chart has
  a table version for screen readers.
- Every query is scoped to the logged-in user; another person's id answers 404, not 403. Login and
  sign up have their own rate limit, and errors always come back as `{ error, message }`.

## Tests

```bash
cd backend && npm test     # API tests: auth, accounts, CSV parsing, imports, rules, reports, budgets, seed
cd frontend && npm test    # UI tests: login, dashboard, transactions, import, categories, budgets, accounts
```

## Project structure

```
backend/
├── prisma/          schema, migrations and demo seed
├── scripts/         setup-db.ts, used by npm run dev
├── src/
│   ├── controllers/ one class per route, with handle()
│   ├── services/    business rules, one class per use case, with execute()
│   ├── routes/      route wiring
│   ├── schemas/     Zod schemas (validation and OpenAPI docs)
│   └── utils/       CSV parsing, fingerprints, rule matching, months, text encoding
└── tests/
frontend/
└── src/
    ├── pages/       one page per route, each with its tests
    ├── components/  UI pieces, charts, forms
    └── lib/         API client, queries, formatting, theme colors
```

Code comments are in Portuguese.
