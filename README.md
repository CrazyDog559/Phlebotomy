# Phlebotomy Prep

An online NHA CPT practice-test app. Email/password sign-in, per-user progress
tracking, a Stripe paywall, and a study-friendly quiz runner (mark each question
**“know it”** or **“not sure,”** and reveal answers **as you go** or **at the end**).

- **5 tests, 550 questions**, each on its own tab.
- **Test #1 is free.** Each additional test is **$2.50**, or **$10 unlocks all 5**.
- Built with **Next.js (App Router)**, **Supabase** (email/password auth + Postgres),
  **Stripe Checkout**, and **Tailwind CSS**. Deploys to **Vercel**.
- Google sign-in can be added later (the `/auth/callback` route is already included).

## Fully public to show case how I can use my technical skills to study for other domains outside of engineering.  AI can help make test questions so easily to help study and I would like to share with everyone for free.  It is also hosted and paid so I could learn how to implement stripe and how to host on vercel.  

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


## Editing questions

Everything lives in `data/tests.json`. Each test has `sections`, each section has
`questions` with `stem`, four `options`, and the correct `answer` letter
(`"A"`–`"D"`). Add, remove, or edit freely — no code changes needed.
