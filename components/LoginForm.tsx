"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { dollars, PER_TEST_CENTS, BUNDLE_CENTS } from "@/lib/pricing";

function LoginInner() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMsg("");
    setLoading(true);

    // Create the client lazily (inside the handler) so it never runs at build time.
    const supabase = createClient();

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      router.push(next);
      router.refresh();
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      if (data.session) {
        router.push(next);
        router.refresh();
      } else {
        setMsg("Account created. Check your email to confirm, then sign in.");
        setMode("signin");
        setLoading(false);
      }
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center gap-10 px-6 py-12 lg:flex-row lg:items-start">
      <div className="w-full max-w-md lg:mt-6">
        <h2 className="text-xl font-bold text-slate-800">
          Why sign in?
        </h2>
        <ul className="mt-4 space-y-3 text-slate-600">
          <li className="flex gap-2">
            <span className="text-brand">✓</span>
            <span>550 realistic questions across 5 full-length NHA CPT practice exams.</span>
          </li>
          <li className="flex gap-2">
            <span className="text-brand">✓</span>
            <span>Every question comes with an explanation, not just the right letter.</span>
          </li>
          <li className="flex gap-2">
            <span className="text-brand">✓</span>
            <span>Your progress and answers are saved so you can pick up where you left off.</span>
          </li>
          <li className="flex gap-2">
            <span className="text-brand">✓</span>
            <span>The first test is free — additional tests are {dollars(PER_TEST_CENTS)} each, or {dollars(BUNDLE_CENTS)} for all 5.</span>
          </li>
        </ul>

        <h3 className="mt-8 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Testimonials
        </h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm italic text-slate-600">
              “These practice tests are exactly what I needed to feel ready
              for exam day.”
            </p>
            <p className="mt-3 text-sm font-semibold text-slate-700">Andrew W.</p>
            <p className="mt-1 text-xs text-slate-500">NHA CPT Certification Exam</p>
            <p className="mt-2 text-sm">
              <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-xs font-semibold text-emerald-700">
                PASS
              </span>
              <span className="ml-2 text-slate-600">Scaled score 437</span>
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm italic text-slate-600">
              “Working through every question bank made the real test feel
              familiar instead of stressful.”
            </p>
            <p className="mt-3 text-sm font-semibold text-slate-700">Avery U.</p>
            <p className="mt-1 text-xs text-slate-500">NHA CPT Certification Exam</p>
            <p className="mt-2 text-sm">
              <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-xs font-semibold text-emerald-700">
                PASS
              </span>
              <span className="ml-2 text-slate-600">Scaled score 430</span>
            </p>
          </div>
        </div>
        <p className="mt-2 text-xs text-slate-400">
          Paraphrased from two people who studied with these practice tests
          before passing their exam.
        </p>
      </div>

      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-center text-2xl font-bold text-brand">
          Phlebotomy Prep
        </h1>
        <p className="mt-2 text-center text-sm text-slate-500">
          {mode === "signin"
            ? "Sign in to take practice tests and track your progress."
            : "Create an account — the first test is free."}
        </p>

        <form onSubmit={submit} className="mt-6 space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">
              Email
            </label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-brand focus:ring-1 focus:ring-brand"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">
              Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              autoComplete={
                mode === "signin" ? "current-password" : "new-password"
              }
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-brand focus:ring-1 focus:ring-brand"
              placeholder="At least 6 characters"
            />
          </div>

          {error && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
          {msg && (
            <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {msg}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-brand px-4 py-2.5 font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
          >
            {loading
              ? "Please wait…"
              : mode === "signin"
              ? "Sign in"
              : "Create account"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-500">
          {mode === "signin" ? "New here? " : "Already have an account? "}
          <button
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setError("");
              setMsg("");
            }}
            className="font-semibold text-brand hover:underline"
          >
            {mode === "signin" ? "Create an account" : "Sign in"}
          </button>
        </p>
      </div>
    </main>
  );
}

export default function LoginForm() {
  return (
    <Suspense>
      <LoginInner />
    </Suspense>
  );
}
