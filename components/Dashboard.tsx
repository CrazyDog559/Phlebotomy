"use client";

import { useState } from "react";
import Link from "next/link";
import {
  dollars,
  PER_TEST_CENTS,
  PER_TEST_MAX_CENTS,
  BUNDLE_CENTS,
  BUNDLE_MAX_CENTS,
  BUNDLE_ID,
  SUPPORT_ID,
  SUPPORT_MIN_CENTS,
  SUPPORT_MAX_CENTS,
  SUPPORT_DEFAULT_CENTS,
  SUPPORT_PRESET_CENTS
} from "@/lib/pricing";

export interface DashboardTest {
  id: string;
  title: string;
  subtitle: string;
  free: boolean;
  count: number;
  access: boolean;
  answered: number;
  correct: number;
}

interface PendingBuy {
  testId: string;
  name: string;
  base: number;
  max: number;
}

export default function Dashboard({
  items,
  ownsAll,
  userName,
  avatar,
  notice
}: {
  items: DashboardTest[];
  ownsAll: boolean;
  userEmail: string;
  userName: string;
  avatar: string;
  notice?: string;
}) {
  const [active, setActive] = useState(items[0]?.id ?? "");
  const [busy, setBusy] = useState<string | null>(null);
  const [pendingBuy, setPendingBuy] = useState<PendingBuy | null>(null);
  const [amountCents, setAmountCents] = useState(0);
  const [supportAmount, setSupportAmount] = useState(SUPPORT_DEFAULT_CENTS);

  const onSupportTab = active === SUPPORT_ID;
  const current = onSupportTab
    ? undefined
    : items.find((i) => i.id === active) ?? items[0];

  function openBuy(testId: string, name: string, base: number, max: number) {
    setPendingBuy({ testId, name, base, max });
    setAmountCents(base);
  }

  async function confirmBuy() {
    if (!pendingBuy) return;
    const { testId } = pendingBuy;
    setBusy(testId);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testId, amount: amountCents })
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else {
        alert(data.error || "Could not start checkout.");
        setBusy(null);
      }
    } catch {
      alert("Network error starting checkout.");
      setBusy(null);
    }
  }

  async function support() {
    setBusy(SUPPORT_ID);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testId: SUPPORT_ID, amount: supportAmount })
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else {
        alert(data.error || "Could not start checkout.");
        setBusy(null);
      }
    } catch {
      alert("Network error starting checkout.");
      setBusy(null);
    }
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <span className="text-lg font-bold text-brand">Phlebotomy Prep</span>
          <div className="flex items-center gap-3">
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatar} alt="" className="h-8 w-8 rounded-full" />
            ) : null}
            <span className="hidden text-sm text-slate-600 sm:inline">
              {userName}
            </span>
            <form action="/auth/signout" method="post">
              <button className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        {notice && (
          <div className="mb-6 rounded-lg border border-brand/30 bg-brand-light px-4 py-3 text-sm text-brand-dark">
            {notice}
          </div>
        )}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-slate-800">Your practice tests</h1>
          {!ownsAll && (
            <button
              onClick={() =>
                openBuy(
                  BUNDLE_ID,
                  "All 5 Phlebotomy Practice Tests",
                  BUNDLE_CENTS,
                  BUNDLE_MAX_CENTS
                )
              }
              disabled={busy !== null}
              className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-dark disabled:opacity-60"
            >
              Unlock all 5 for {dollars(BUNDLE_CENTS)}
            </button>
          )}
        </div>

        {/* Pay-what-you'd-like panel — shown before any purchase goes to checkout */}
        {pendingBuy && (
          <div className="mb-6 rounded-2xl border border-brand/30 bg-brand-light p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-800">
                  Unlock “{pendingBuy.name}”
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Base price is {dollars(pendingBuy.base)}. I’m a computer
                  engineering student building this on my own — if you can,
                  sliding the price up helps me keep adding practice tests
                  for more phlebotomists.
                </p>
              </div>
              <button
                onClick={() => setPendingBuy(null)}
                className="text-sm text-slate-500 hover:text-slate-700"
              >
                Cancel
              </button>
            </div>

            <div className="mt-4">
              <input
                type="range"
                min={pendingBuy.base}
                max={pendingBuy.max}
                step={50}
                value={amountCents}
                onChange={(e) => setAmountCents(Number(e.target.value))}
                className="w-full accent-brand"
              />
              <div className="mt-1 flex justify-between text-xs text-slate-500">
                <span>{dollars(pendingBuy.base)} base</span>
                <span>{dollars(pendingBuy.max)}</span>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-lg font-bold text-brand">
                {dollars(amountCents)}
                {amountCents > pendingBuy.base && (
                  <span className="ml-2 text-sm font-medium text-slate-500">
                    ({dollars(amountCents - pendingBuy.base)} extra — thank you!)
                  </span>
                )}
              </p>
              <button
                onClick={confirmBuy}
                disabled={busy !== null}
                className="rounded-lg bg-brand px-5 py-2.5 font-semibold text-white shadow-sm hover:bg-brand-dark disabled:opacity-60"
              >
                {busy === pendingBuy.testId
                  ? "Starting checkout…"
                  : `Continue to checkout — ${dollars(amountCents)}`}
              </button>
            </div>
          </div>
        )}

        {/* Tabs — one per test, plus Support */}
        <div className="flex flex-wrap gap-2 border-b border-slate-200">
          {items.map((t) => (
            <button
              key={t.id}
              onClick={() => setActive(t.id)}
              className={`-mb-px rounded-t-lg border-b-2 px-4 py-2 text-sm font-medium transition ${
                active === t.id
                  ? "border-brand text-brand"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {t.title.replace("NHA CPT Practice ", "")}
              {t.free && (
                <span className="ml-2 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-emerald-700">
                  Free
                </span>
              )}
              {!t.access && !t.free && <span className="ml-1 text-slate-400">🔒</span>}
            </button>
          ))}
          <button
            onClick={() => setActive(SUPPORT_ID)}
            className={`-mb-px rounded-t-lg border-b-2 px-4 py-2 text-sm font-medium transition ${
              onSupportTab
                ? "border-brand text-brand"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            💛 Support
          </button>
        </div>

        {/* Support tab panel */}
        {onSupportTab && (
          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-800">
              Support Phlebotomy Prep
            </h2>
            <p className="mt-2 max-w-2xl text-slate-600">
              Hi — I’m a computer engineering student, and I built Phlebotomy
              Prep on my own to help people study for the NHA CPT
              certification exam. Tests stay at {dollars(PER_TEST_CENTS)} each
              (or {dollars(BUNDLE_CENTS)} for all 5) no matter what — but if
              this helped you and you’d like to give back, any amount here
              goes straight toward writing more practice questions and
              explanations for future phlebotomists.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              {SUPPORT_PRESET_CENTS.map((c) => (
                <button
                  key={c}
                  onClick={() => setSupportAmount(c)}
                  className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition ${
                    supportAmount === c
                      ? "border-brand bg-brand text-white"
                      : "border-slate-300 text-slate-600 hover:border-brand hover:text-brand"
                  }`}
                >
                  {dollars(c)}
                </button>
              ))}
            </div>

            <div className="mt-4 max-w-md">
              <input
                type="range"
                min={SUPPORT_MIN_CENTS}
                max={SUPPORT_MAX_CENTS}
                step={100}
                value={supportAmount}
                onChange={(e) => setSupportAmount(Number(e.target.value))}
                className="w-full accent-brand"
              />
              <div className="mt-1 flex justify-between text-xs text-slate-500">
                <span>{dollars(SUPPORT_MIN_CENTS)}</span>
                <span>{dollars(SUPPORT_MAX_CENTS)}</span>
              </div>
            </div>

            <div className="mt-5 flex items-center gap-4">
              <p className="text-lg font-bold text-brand">
                {dollars(supportAmount)}
              </p>
              <button
                onClick={support}
                disabled={busy !== null}
                className="rounded-lg bg-brand px-5 py-2.5 font-semibold text-white shadow-sm hover:bg-brand-dark disabled:opacity-60"
              >
                {busy === SUPPORT_ID
                  ? "Starting checkout…"
                  : `Support with ${dollars(supportAmount)}`}
              </button>
            </div>
          </section>
        )}

        {/* Active test tab panel */}
        {!onSupportTab && current && (
          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-800">{current.title}</h2>
                <p className="text-slate-500">{current.subtitle}</p>
                <p className="mt-1 text-sm text-slate-400">
                  {current.count} questions
                </p>
              </div>
              {current.free ? (
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">
                  Free
                </span>
              ) : current.access ? (
                <span className="rounded-full bg-brand-light px-3 py-1 text-sm font-semibold text-brand">
                  Unlocked
                </span>
              ) : (
                <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-700">
                  {dollars(PER_TEST_CENTS)}
                </span>
              )}
            </div>

            {current.access && current.answered > 0 && (
              <div className="mt-5 rounded-lg bg-slate-50 p-4">
                <div className="flex items-center justify-between text-sm text-slate-600">
                  <span>
                    Progress: {current.answered}/{current.count} answered
                  </span>
                  <span>
                    {current.correct} correct so far (
                    {current.answered > 0
                      ? Math.round((current.correct / current.answered) * 100)
                      : 0}
                    %)
                  </span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-brand"
                    style={{
                      width: `${(current.answered / current.count) * 100}%`
                    }}
                  />
                </div>
              </div>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              {current.access ? (
                <Link
                  href={`/test/${current.id}`}
                  className="rounded-lg bg-brand px-5 py-2.5 font-semibold text-white shadow-sm hover:bg-brand-dark"
                >
                  {current.answered > 0 ? "Continue test" : "Start test"}
                </Link>
              ) : (
                <>
                  <button
                    onClick={() =>
                      openBuy(
                        current.id,
                        current.title,
                        PER_TEST_CENTS,
                        PER_TEST_MAX_CENTS
                      )
                    }
                    disabled={busy !== null}
                    className="rounded-lg bg-brand px-5 py-2.5 font-semibold text-white shadow-sm hover:bg-brand-dark disabled:opacity-60"
                  >
                    Unlock this test — {dollars(PER_TEST_CENTS)}
                  </button>
                  {!ownsAll && (
                    <button
                      onClick={() =>
                        openBuy(
                          BUNDLE_ID,
                          "All 5 Phlebotomy Practice Tests",
                          BUNDLE_CENTS,
                          BUNDLE_MAX_CENTS
                        )
                      }
                      disabled={busy !== null}
                      className="rounded-lg border border-brand px-5 py-2.5 font-semibold text-brand hover:bg-brand-light disabled:opacity-60"
                    >
                      Or unlock all 5 for {dollars(BUNDLE_CENTS)}
                    </button>
                  )}
                </>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
