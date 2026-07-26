"use client";

import { useState } from "react";
import Link from "next/link";
import { dollars, PER_TEST_CENTS, BUNDLE_CENTS } from "@/lib/pricing";

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
  const current = items.find((i) => i.id === active) ?? items[0];

  async function buy(testId: string) {
    setBusy(testId);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testId })
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
              onClick={() => buy("all")}
              disabled={busy !== null}
              className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-dark disabled:opacity-60"
            >
              {busy === "all"
                ? "Starting checkout…"
                : `Unlock all 5 for ${dollars(BUNDLE_CENTS)}`}
            </button>
          )}
        </div>

        {/* Tabs — one per test */}
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
        </div>

        {/* Active tab panel */}
        {current && (
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
                    onClick={() => buy(current.id)}
                    disabled={busy !== null}
                    className="rounded-lg bg-brand px-5 py-2.5 font-semibold text-white shadow-sm hover:bg-brand-dark disabled:opacity-60"
                  >
                    {busy === current.id
                      ? "Starting checkout…"
                      : `Unlock this test — ${dollars(PER_TEST_CENTS)}`}
                  </button>
                  {!ownsAll && (
                    <button
                      onClick={() => buy("all")}
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
