# Phlebotomy Prep

An online NHA CPT practice-test app. Email/password sign-in, per-user progress
tracking, a Stripe paywall, and a study-friendly quiz runner (mark each question
**“know it”** or **“not sure,”** and reveal answers **as you go** or **at the end**).

- **5 tests, 550 questions**, each on its own tab.
- **Test #1 is free.** Each additional test is **$2.50**, or **$10 unlocks all 5**.
- Built with **Next.js (App Router)**, **Supabase** (email/password auth + Postgres),
  **Stripe Checkout**, and **Tailwind CSS**. Deploys to **Vercel**.
- Google sign-in can be added later (the `/auth/callback` route is already included).

> **New here?** Open **DEPLOY.md** — it walks you through every account, key, and
> click needed to get this live. This README is the short version.

## What's inside

| Path | Purpose |
| --- | --- |
| `data/tests.json` | All 5 tests and answer keys (generated from your PDFs). |
| `app/page.tsx` | Dashboard: tabs per test, lock/buy states, progress. |
| `app/login/page.tsx` | Email/password sign-in & account creation. |
| `app/test/[testId]/` | Quiz runner (access-checked server-side). |
| `app/api/checkout/` | Creates a Stripe Checkout session. |
| `app/api/stripe/webhook/` | Grants access after a successful payment. |
| `lib/supabase/` | Browser + server Supabase clients and session middleware. |
| `lib/pricing.ts` | Prices and the access rule (free / owned / bundle). |
| `supabase/schema.sql` | Database tables + row-level security. Run once in Supabase. |

## Local development

```bash
npm install
cp .env.local.example .env.local   # then fill in the values (see DEPLOY.md)
npm run dev                         # http://localhost:3000
```

You need a Supabase project and Stripe **test** keys before sign-in and payments
will work locally. For local webhooks:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copy the `whsec_…` it prints into `STRIPE_WEBHOOK_SECRET`.

## Editing questions

Everything lives in `data/tests.json`. Each test has `sections`, each section has
`questions` with `stem`, four `options`, and the correct `answer` letter
(`"A"`–`"D"`). Add, remove, or edit freely — no code changes needed.
