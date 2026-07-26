# Deploy guide — Phlebotomy Prep

This gets the site live on Vercel with Google login, Supabase database, and Stripe
payments. Budget ~30–45 minutes. Everything below is free except the ~$0 Stripe
account (Stripe only takes a per-transaction fee when you actually sell something).

---

## TL;DR — what I need from you

You don't send me anything secret. **You** paste these into Vercel's Environment
Variables (Step 6). Gather them as you go:

| Value | Where it comes from | Step |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API | 2 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API (the publishable/anon key) | 2 |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API (**keep secret**) | 2 |
| `STRIPE_SECRET_KEY` | Stripe → Developers → API keys | 5 |
| `STRIPE_WEBHOOK_SECRET` | Stripe → Developers → Webhooks (after Step 7) | 7 |
| `NEXT_PUBLIC_SITE_URL` | Your Vercel URL, e.g. `https://yourapp.vercel.app` | 6 |

Login is **email + password** (no Google needed to launch). You can add Google later.
Also decide: **a project name** and, optionally, **a custom domain**.

---

## Step 1 — Put the code on GitHub

1. Create a new **empty** repo at github.com (e.g. `phlebotomy-prep`).
2. From this project folder:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/<you>/phlebotomy-prep.git
   git push -u origin main
   ```

## Step 2 — Create the Supabase project + database

1. Go to **supabase.com** → **New project**. Pick a name and a strong DB password
   (you won't need the password again for this app). Wait for it to finish.
2. Left sidebar → **Project Settings → API**. Copy three values:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` *(secret — never put in client code)*
3. Left sidebar → **SQL Editor → New query**. Open `supabase/schema.sql` from this
   repo, paste the whole thing, and click **Run**. This creates the `purchases`
   and `progress` tables with row-level security.

## Step 3 — Turn on email/password login

Email/password is enabled by default in Supabase, so there's almost nothing to do.

1. **Supabase → Authentication → Providers → Email**: confirm it's **enabled**.
2. **Fastest path for launch:** turn **OFF** “Confirm email” (same Email settings
   panel). New users can then sign in immediately after creating an account — no email
   sending required. *(Leave it ON only if you want to verify addresses; Supabase's
   built-in email has low rate limits, so for real volume you'd add an SMTP provider.)*
3. **Adding Google later (optional):** create an OAuth client in Google Cloud Console,
   paste the Client ID/Secret into **Authentication → Providers → Google**, and add a
   “Sign in with Google” button. The app already includes the `/auth/callback` route
   for this, so it's a small change when you're ready.

## Step 4 — (You already have Stripe) grab your keys

1. In the **Stripe Dashboard**, stay in **Test mode** while setting up.
2. **Developers → API keys** → copy the **Secret key** (`sk_test_…`) →
   `STRIPE_SECRET_KEY`.
   *(The webhook secret comes in Step 7, after the site has a URL.)*

## Step 5 — Deploy to Vercel

1. Go to **vercel.com → Add New → Project** and import your GitHub repo.
2. Framework preset auto-detects **Next.js**. Don't deploy yet — first add env vars
   (next step). If it deploys once and fails for missing envs, that's fine; you'll
   redeploy.

## Step 6 — Add environment variables in Vercel

Project → **Settings → Environment Variables**. Add each of these (Production +
Preview), then **Redeploy**:

```
NEXT_PUBLIC_SUPABASE_URL       = https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY  = <anon public key>
SUPABASE_SERVICE_ROLE_KEY      = <service_role key>
STRIPE_SECRET_KEY              = sk_test_...
STRIPE_WEBHOOK_SECRET          = whsec_...   (fill after Step 7)
NEXT_PUBLIC_SITE_URL           = https://<your-app>.vercel.app
```

After the first successful deploy, note your real URL and make sure
`NEXT_PUBLIC_SITE_URL` matches it exactly (no trailing slash).

## Step 7 — Create the Stripe webhook

1. **Stripe → Developers → Webhooks → Add endpoint.**
2. Endpoint URL: `https://<your-app>.vercel.app/api/stripe/webhook`
3. **Events to send:** select **`checkout.session.completed`**.
4. Create it, then copy the **Signing secret** (`whsec_…`) into Vercel as
   `STRIPE_WEBHOOK_SECRET`, and **Redeploy**.

## Step 8 — Point auth back at your domain

1. **Supabase → Authentication → URL Configuration**:
   - **Site URL**: `https://<your-app>.vercel.app`
   - **Redirect URLs**: add `https://<your-app>.vercel.app/auth/callback`
   (and `http://localhost:3000/auth/callback` if you develop locally).
2. If you add a custom domain later, add it here **and** in
   `NEXT_PUBLIC_SITE_URL`, and in the Google OAuth authorized origins.

## Step 9 — Test the whole flow

1. Visit your site → **Sign in with Google**.
2. **Test #1** should be free and playable; try marking questions “know it”/“not
   sure” and both reveal modes; refresh mid-test to confirm progress saved.
3. Open a locked test → **Unlock this test $2.50** → pay with Stripe's test card
   **4242 4242 4242 4242**, any future expiry, any CVC, any ZIP.
4. You return to the dashboard and the test unlocks (the webhook grants it). If it's
   still locked, wait a few seconds and refresh — check **Stripe → Webhooks** for a
   `200` delivery if it doesn't.

## Step 10 — Go live

When you're ready to take real payments:
1. Flip Stripe to **Live mode**, get the **live** `sk_live_…` key, and create a
   **live** webhook (same URL + event). Update `STRIPE_SECRET_KEY` and
   `STRIPE_WEBHOOK_SECRET` in Vercel with the live values, then redeploy.
2. Complete Stripe's business/bank onboarding so payouts can reach you.

---

## Pricing (already coded — change here if needed)

`lib/pricing.ts`:
- `PER_TEST_CENTS = 250` → $2.50 per test
- `BUNDLE_CENTS = 1000` → $10.00 for all 5

## Notes & choices baked in

- **Login is required** to take any test (so progress can be saved per person). The
  first test is free once signed in. Say the word if you'd rather allow the free test
  without an account.
- **Access is enforced on the server** (`app/test/[testId]/page.tsx`) and purchases
  are only ever written by the **verified Stripe webhook**, so users can't unlock
  tests from the browser.
- **Progress autosaves** on every answer and confidence mark. “Restart” on the
  results screen clears a test's progress.
- The 5th test (“Phlebotomy Flashcard Test,” 150 Q) reproduces two community Quizlet
  sets; a couple of those source answers are debatable — see our earlier note.
